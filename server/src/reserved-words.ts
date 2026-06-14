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

const DOCUMENTATION: Record<string, string> = {
  case: [
    '**rc keyword:** `case pattern ...`',
    '',
    'Used inside `switch`. If a pattern matches the switch subject, rc executes commands until the next `case`.',
  ].join('\n'),
  else: [
    '**rc keyword:** `else command`',
    '',
    'Runs the alternate command of an `if`. In this rc, `else` is valid only after a close brace on the same line.',
  ].join('\n'),
  fn: [
    '**rc keyword:** `fn name { commands }`',
    '',
    'Defines a shell function. Without a body, `fn name` removes the function definition.',
  ].join('\n'),
  for: [
    '**rc keyword:** `for (var in list) command`',
    '',
    'Sets `var` to each element of `list` and runs `command`. If `in list` is omitted, rc iterates over `$*`.',
  ].join('\n'),
  if: [
    '**rc keyword:** `if (test) command [else command]`',
    '',
    'Runs `test`; if its status is zero, runs the first command, otherwise runs the `else` command when present.',
  ].join('\n'),
  in: [
    '**rc keyword:** `in`',
    '',
    'Introduces the list in a `for (var in list)` loop.',
  ].join('\n'),
  switch: [
    '**rc keyword:** `switch (list) { case ... }`',
    '',
    'Matches `list` against `case` patterns and runs the commands for the matching case.',
  ].join('\n'),
  while: [
    '**rc keyword:** `while (test) command`',
    '',
    'Runs `command` while `test` exits with zero status.',
  ].join('\n'),
}

export function documentationFor(word: string): string | null {
  return DOCUMENTATION[word] ?? null
}
