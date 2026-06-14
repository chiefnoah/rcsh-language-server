export const LIST = [
  'case',
  'else',
  'fn',
  'for',
  'if',
  'in',
  'switch',
  'while',
]

const SET = new Set(LIST)

export function isReservedWord(word: string): boolean {
  return SET.has(word)
}
