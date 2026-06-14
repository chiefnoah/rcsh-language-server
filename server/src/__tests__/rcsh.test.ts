import { pathToFileURL } from 'node:url'

import * as LSP from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'

import { getMockConnection } from '../../../testing/mocks'
import Analyzer from '../analyser'
import { initializeParser } from '../parser'
import RcshServer from '../server'
import { CompletionItemDataType } from '../types'
import { Logger } from '../util/logger'

jest.mock('../executables', () => ({
  __esModule: true,
  default: class MockExecutables {
    static async fromPath() {
      return new MockExecutables()
    }

    list() {
      return ['echo']
    }

    isExecutableOnPATH(word: string) {
      return word === 'echo'
    }
  },
}))

jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {
  // noop
})

jest.setTimeout(30000)

const uri = 'file:///workspace/example.rcsh'

async function createAnalyzer() {
  const parser = await initializeParser()
  return new Analyzer({
    parser,
    workspaceFolder: 'file:///workspace',
  })
}

async function createServer() {
  const connection = getMockConnection()
  const server = await RcshServer.initialize(connection, {
    rootPath: null,
    rootUri: 'file:///workspace',
    processId: 42,
    capabilities: {},
    workspaceFolders: null,
  })

  server.register(connection)

  return { connection, server }
}

function document(text: string) {
  return TextDocument.create(uri, 'rcsh', 1, text)
}

describe('rcsh analyzer', () => {
  it('extracts rc function and variable declarations', async () => {
    const analyzer = await createAnalyzer()
    const doc = document(
      [
        '#!/usr/bin/env rc',
        'fn greet {',
        '\techo $name',
        '}',
        'name=world',
        'form=(--form-string token=$token)',
        '',
      ].join('\n'),
    )

    expect(analyzer.analyze({ document: doc, uri })).toEqual([])

    expect(
      analyzer.getDeclarationsForUri({ uri }).map((symbol) => ({
        name: symbol.name,
        kind: symbol.kind,
        line: symbol.location.range.start.line + 1,
      })),
    ).toEqual([
      { name: 'greet', kind: LSP.SymbolKind.Function, line: 2 },
      { name: 'name', kind: LSP.SymbolKind.Variable, line: 5 },
      { name: 'form', kind: LSP.SymbolKind.Variable, line: 6 },
    ])
  })

  it('finds variable references', async () => {
    const analyzer = await createAnalyzer()
    const doc = document(['name=world', 'echo $name', ''].join('\n'))

    analyzer.analyze({ document: doc, uri })

    expect(analyzer.findReferences('name')).toEqual([
      LSP.Location.create(uri, LSP.Range.create(0, 0, 0, 4)),
      LSP.Location.create(uri, LSP.Range.create(1, 5, 1, 10)),
    ])
  })
})

describe('rcsh server', () => {
  let connection: jest.Mocked<LSP.Connection>
  let server: RcshServer

  beforeEach(async () => {
    ;({ connection, server } = await createServer())
  })

  it('offers symbol completions after $', async () => {
    const doc = document(['name=world', 'echo $', ''].join('\n'))
    await server.analyzeAndLintDocument(doc)

    const onCompletion = connection.onCompletion.mock.calls[0][0]
    const completions = await onCompletion(
      {
        textDocument: { uri },
        position: { line: 1, character: 6 },
      },
      {} as any,
      {} as any,
    )

    expect(completions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'name',
          data: { type: CompletionItemDataType.Symbol },
        }),
      ]),
    )
  })

  it('renames function definitions and calls', async () => {
    const doc = document(['fn greet {', '\techo hi', '}', 'greet', ''].join('\n'))
    await server.analyzeAndLintDocument(doc)

    const onRenameRequest = connection.onRenameRequest.mock.calls[0][0]
    const edit = await onRenameRequest(
      {
        textDocument: { uri },
        position: { line: 3, character: 1 },
        newName: 'salute',
      },
      {} as any,
      {} as any,
    )

    expect(edit).toEqual({
      changes: {
        [uri]: [
          LSP.TextEdit.replace(LSP.Range.create(0, 3, 0, 8), 'salute'),
          LSP.TextEdit.replace(LSP.Range.create(3, 0, 3, 5), 'salute'),
        ],
      },
    })
  })

  it('returns function references', async () => {
    const doc = document(['fn greet {', '\techo hi', '}', 'greet', ''].join('\n'))
    await server.analyzeAndLintDocument(doc)

    const onReferences = connection.onReferences.mock.calls[0][0]
    const references = await onReferences(
      {
        textDocument: { uri },
        position: { line: 3, character: 1 },
        context: { includeDeclaration: true },
      },
      {} as any,
      {} as any,
    )

    expect(references).toEqual([
      LSP.Location.create(uri, LSP.Range.create(0, 3, 0, 8)),
      LSP.Location.create(uri, LSP.Range.create(3, 0, 3, 5)),
    ])
  })
})
