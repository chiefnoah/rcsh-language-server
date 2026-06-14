// any shebang
const SHEBANG_REGEXP = /^#!(.+)/

// either /path/to/env [-S] <shell> or /path/to/<shell>
// NOTE that the path does not necessarily end with `/bin/`,
//      e.g. `#!/hint/sh` is an idiom
// NOTE that `/path/to/env /path/to/<shell>` is also technically valid
//      but we do not handle it here, same as `/path/to/env KEY=VAL... <shell>`
const SHEBANG_INTERPRETER_REGEXP = /^[/](?:[^ /]+[/])*(?:env +(?:-S +)?)?([^ /]+)/

// any empty line, or a comment on an empty line, or a shell directive with
// a `shell=...` entry in it
// (the first continuous run of such lines in a file is the region eligible for
//  a `shell=...` directive)
const SHELL_DIRECTIVE_OR_EMPTY_REGEXP =
  /^\s*(?:#\s*rcsh-ls\s+(?:\S+\s+)*shell=(\w+)|#|$)/

export const RC_DIALECTS = ['rc', 'rcsh'] as const
type RcDialect = (typeof RC_DIALECTS)[number]

function getShebang(fileContent: string): string | null {
  const match = SHEBANG_REGEXP.exec(fileContent)
  if (!match || !match[1]) {
    return null
  }
  return match[1].trim()
}

function parseShebang(fileContent: string): string | null {
  const shebang = getShebang(fileContent)
  if (!shebang) {
    return null
  }
  const match = SHEBANG_INTERPRETER_REGEXP.exec(shebang)
  if (!match || !match[1]) {
    return null
  }
  return match[1].trim()
}

function parseShellDirective(fileContent: string): string | null {
  const contentLines = fileContent.split('\n')
  for (const line of contentLines) {
    const match = SHELL_DIRECTIVE_OR_EMPTY_REGEXP.exec(line)
    // stop if we have a non-empty non-comment line
    if (match === null) {
      break
    }
    // stop if we have a `shell=...` directive
    if (match[1]) {
      return match[1].trim()
    }
    // otherwise continue to scan
  }
  return null
}

function parseUri(uri: string): string | null {
  if (uri.endsWith('.rcsh') || uri.endsWith('.rc')) {
    return 'rcsh'
  }
  return null
}

export function analyzeFile(
  uri: string,
  fileContent: string,
): {
  shebang: string | null
  directive: string | null
  dialect: RcDialect | null
  isDetected: boolean
} {
  const directive = parseShellDirective(fileContent)
  const shebang = parseShebang(fileContent)
  const parsed = directive ?? shebang ?? parseUri(uri)
  const dialect = parsed ?? 'rcsh'
  return {
    shebang,
    directive,
    dialect: RC_DIALECTS.includes(dialect as any) ? (dialect as any) : null,
    isDetected: parsed !== null,
  }
}
