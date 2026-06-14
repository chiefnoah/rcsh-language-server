import * as LSP from 'vscode-languageserver/node'
import * as Parser from 'web-tree-sitter'

import * as TreeSitterUtil from './tree-sitter'

const TREE_SITTER_TYPE_TO_LSP_KIND: { [type: string]: LSP.SymbolKind | undefined } = {
  word: LSP.SymbolKind.Variable,
}

export type GlobalDeclarations = { [word: string]: LSP.SymbolInformation }
export type Declarations = { [word: string]: LSP.SymbolInformation[] }

const GLOBAL_DECLARATION_LEAF_NODE_TYPES = new Set([
  'heredoc_body',
  'quoted_string',
])

/**
 * Returns declarations (functions or variables) from a given root node
 * that would be available after sourcing the file. This currently does
 * not include global variables defined inside if statements or functions
 * as we do not do any flow tracing.
 *
 * Will only return one declaration per symbol name – the latest definition.
 * This behavior is consistent with how rc behaves, but differs between
 * LSP servers.
 *
 * Used when finding declarations for sourced files and to get declarations
 * for the entire workspace.
 */
export function getGlobalDeclarations({
  tree,
  uri,
}: {
  tree: Parser.Tree
  uri: string
}): GlobalDeclarations {
  const globalDeclarations: GlobalDeclarations = {}

  TreeSitterUtil.forEach(tree.rootNode, (node) => {
    const followChildren = !GLOBAL_DECLARATION_LEAF_NODE_TYPES.has(node.type)

    const symbol = getDeclarationSymbolFromNode({ node, uri })
    if (symbol) {
      const word = symbol.name
      globalDeclarations[word] = symbol
    }

    return followChildren
  })

  return globalDeclarations
}

/**
 * Returns all declarations (functions or variables) from a given tree.
 * This includes local variables.
 */
export function getAllDeclarationsInTree({
  tree,
  uri,
}: {
  tree: Parser.Tree
  uri: string
}): LSP.SymbolInformation[] {
  const symbols: LSP.SymbolInformation[] = []

  TreeSitterUtil.forEach(tree.rootNode, (node) => {
    const symbol = getDeclarationSymbolFromNode({ node, uri })
    if (symbol) {
      symbols.push(symbol)
    }
  })

  return symbols
}

/**
 * Returns declarations available for the given file and location.
 * The heuristics used is a simplification compared to rc behavior,
 * but deemed good enough, compared to the complexity of flow tracing.
 *
 * Used when getting declarations for the current scope.
 */
export function getLocalDeclarations({
  node,
  rootNode,
  uri,
}: {
  node: Parser.SyntaxNode | null
  rootNode: Parser.SyntaxNode
  uri: string
}): Declarations {
  const declarations: Declarations = {}

  // Bottom up traversal to capture all local and scoped declarations
  const walk = (node: Parser.SyntaxNode | null) => {
    // NOTE: there is also node.walk
    if (node) {
      for (const childNode of node.children) {
        let symbol: LSP.SymbolInformation | null = null

        symbol = getDeclarationSymbolFromNode({ node: childNode, uri })

        if (symbol) {
          if (!declarations[symbol.name]) {
            declarations[symbol.name] = []
          }
          declarations[symbol.name].push(symbol)
        }
      }

      walk(node.parent)
    }
  }

  walk(node)

  // Top down traversal to add global variables.
  Object.entries(
    getAllGlobalVariableDeclarations({
      rootNode,
      uri,
    }),
  ).map(([name, symbols]) => {
    if (!declarations[name]) {
      declarations[name] = symbols
    }
  })

  return declarations
}

function getAllGlobalVariableDeclarations({
  uri,
  rootNode,
}: {
  uri: string
  rootNode: Parser.SyntaxNode
}) {
  const declarations: Declarations = {}

  TreeSitterUtil.forEach(rootNode, (node) => {
    if (TreeSitterUtil.isVariableAssignment(node)) {
      const symbol = nodeToSymbolInformation({ node, uri })
      if (symbol) {
        if (!declarations[symbol.name]) {
          declarations[symbol.name] = []
        }
        declarations[symbol.name].push(symbol)
      }
    }

    return
  })

  return declarations
}

function nodeToSymbolInformation({
  node,
  uri,
}: {
  node: Parser.SyntaxNode
  uri: string
}): LSP.SymbolInformation | null {
  const kind = TreeSitterUtil.isFunctionDefinition(node)
    ? LSP.SymbolKind.Function
    : TREE_SITTER_TYPE_TO_LSP_KIND[node.type]

  return LSP.SymbolInformation.create(
    TreeSitterUtil.symbolName(node),
    kind || LSP.SymbolKind.Variable,
    TreeSitterUtil.range(TreeSitterUtil.symbolNode(node) ?? node),
    uri,
  )
}

function getDeclarationSymbolFromNode({
  node,
  uri,
}: {
  node: Parser.SyntaxNode
  uri: string
}): LSP.SymbolInformation | null {
  if (TreeSitterUtil.isDefinition(node)) {
    return nodeToSymbolInformation({ node, uri })
  }

  return null
}

// The functions that follow search for a single declaration based on the
// original definition NOT the latest.

export type FindDeclarationParams = {
  /**
   * The node where the search will start.
   */
  baseNode: Parser.SyntaxNode
  symbolInfo: {
    position: LSP.Position
    uri: string
    word: string
    kind: LSP.SymbolKind
  }
  otherInfo: {
    /**
     * The current URI being searched.
     */
    currentUri: string
    /**
     * The line (LSP semantics) or row (tree-sitter semantics) at which to stop
     * searching.
     */
    boundary: LSP.uinteger
  }
}

/**
 * Searches for the original declaration of `symbol`. Global semantics here
 * means that the symbol is not local to a function, hence, `baseNode` should
 * usually be the `source_file` node and `symbolInfo` should contain data
 * about a variable or a function.
 */
export function findDeclarationUsingGlobalSemantics({
  baseNode,
  symbolInfo: { position, uri, word, kind },
  otherInfo: { currentUri, boundary },
}: FindDeclarationParams) {
  let declaration: Parser.SyntaxNode | null | undefined
  let continueSearching = false

  TreeSitterUtil.forEach(baseNode, (n) => {
    if (
      (declaration && !continueSearching) ||
      n.startPosition.row > boundary ||
      n.type === 'heredoc_body' ||
      n.type === 'quoted_string'
    ) {
      return false
    }

    if (kind === LSP.SymbolKind.Variable && TreeSitterUtil.isVariableAssignment(n)) {
      const definedVariableInExpression =
        uri === currentUri &&
        !!n.nextNamedSibling &&
        isDefinedVariableInExpression(n.nextNamedSibling, n, position)

      if (TreeSitterUtil.symbolName(n) === word && !definedVariableInExpression) {
        declaration = TreeSitterUtil.symbolNode(n) ?? n
        continueSearching = false

        return false
      }

      return true
    }

    if (
      kind === LSP.SymbolKind.Variable &&
      n.type === 'variable' &&
      TreeSitterUtil.symbolName(n) === word
    ) {
      declaration = TreeSitterUtil.symbolNode(n) ?? n
      continueSearching = false
      return false
    }

    if (
      kind === LSP.SymbolKind.Function &&
      TreeSitterUtil.isFunctionDefinition(n) &&
      TreeSitterUtil.symbolName(n) === word
    ) {
      declaration = TreeSitterUtil.symbolNode(n) ?? n
      continueSearching = false
      return false
    }

    return true
  })

  return { declaration, continueSearching }
}

/**
 * Searches for the original declaration of `symbol`. Local semantics here
 * means that the symbol is local to a function, hence, `baseNode` should
 * rcsh currently has no local-scope AST nodes in the grammar. Keep this
 * function as a compatibility shim for the analyzer's rename flow.
 */
export function findDeclarationUsingLocalSemantics({
  baseNode,
  symbolInfo: { position, word },
  otherInfo: { boundary },
}: FindDeclarationParams) {
  let declaration: Parser.SyntaxNode | null | undefined
  let continueSearching = false

  TreeSitterUtil.forEach(baseNode, (n) => {
    if ((declaration && !continueSearching) || n.startPosition.row > boundary) {
      return false
    }

    if (
      TreeSitterUtil.isVariableAssignment(n) &&
      TreeSitterUtil.symbolName(n) === word &&
      !isDefinedVariableInExpression(n.nextNamedSibling ?? n, n, position)
    ) {
      declaration = n
      continueSearching = false
      return false
    }

    return true
  })

  return { declaration, continueSearching }
}

/**
 * This is used in checking self-assignment `var=$var` edge cases where
 * `position` is within `$var`. Based on the `definition` node (should be
 * assignment operator and definition node, estimates if `position` is within the expression
 * (after the equals sign) of an assignment. If it is, then `var` should be
 * skipped and a higher scope should be checked for the original declaration.
 */
function isDefinedVariableInExpression(
  definition: Parser.SyntaxNode,
  variable: Parser.SyntaxNode,
  position: LSP.Position,
): boolean {
  return (
    definition.endPosition.row >= position.line &&
    (variable.endPosition.column < position.character ||
      variable.endPosition.row < position.line)
  )
}
