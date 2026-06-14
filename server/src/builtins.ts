export const LIST = [
  'access',
  'builtin',
  'break',
  'cd',
  'echo',
  'eval',
  'exec',
  'exit',
  'flag',
  'fork',
  'rfork',
  'shift',
  'status',
  'wait',
  'whatis',
  '~',
  'switch',
  'fn',
  'for',
  'if',
  'while',
  'case',
  'continue',
]

const SET = new Set(LIST)

export function isBuiltin(word: string): boolean {
  return SET.has(word)
}
