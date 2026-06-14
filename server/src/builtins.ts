export const LIST = [
  '.',
  'builtin',
  'break',
  'cd',
  'continue',
  'echo',
  'eval',
  'exec',
  'exit',
  'flag',
  'limit',
  'newpgrp',
  'return',
  'shift',
  'umask',
  'wait',
  'whatis',
  '~',
]

const SET = new Set(LIST)

export function isBuiltin(word: string): boolean {
  return SET.has(word)
}

const DOCUMENTATION: Record<string, string> = {
  '.': [
    '**rc builtin:** `. [-i] file [arg ...]`',
    '',
    'Reads `file` as rc input and executes its contents. With `-i`, input is interactive. Arguments after `file` become the sourced file arguments.',
  ].join('\n'),
  break: [
    '**rc builtin:** `break`',
    '',
    'Breaks from the innermost `for` or `while` loop. It is an error outside a loop. `switch` cases do not use `break`.',
  ].join('\n'),
  builtin: [
    '**rc builtin:** `builtin command [arg ...]`',
    '',
    'Runs `command` while ignoring any function with the same name. This lets wrapper functions call the underlying builtin or executable.',
  ].join('\n'),
  cd: [
    '**rc builtin:** `cd [directory]`',
    '',
    'Changes the current directory. With no argument, changes to `$home`. The `$cdpath` list is searched for relative targets.',
  ].join('\n'),
  continue: [
    '**rc builtin:** `continue`',
    '',
    'Continues the innermost `for` or `while` loop. It is an error outside a loop.',
  ].join('\n'),
  echo: [
    '**rc builtin:** `echo [-n] [--] [arg ...]`',
    '',
    'Prints arguments separated by spaces. A final newline is printed unless the first argument is `-n`. Use `--` first to echo a literal `-n`.',
  ].join('\n'),
  eval: [
    '**rc builtin:** `eval [list]`',
    '',
    'Joins list elements with spaces and feeds the resulting string back to rc for parsing. This is the explicit way to rescan generated rc input.',
  ].join('\n'),
  exec: [
    '**rc builtin:** `exec [arg ...]`',
    '',
    'Replaces the current rc process with the command. If only redirections are supplied, applies those redirections to the current shell.',
  ].join('\n'),
  exit: [
    '**rc builtin:** `exit [status]`',
    '',
    'Exits the current shell. If `status` is omitted, rc exits with the current value of `$status`.',
  ].join('\n'),
  flag: [
    '**rc builtin:** `flag f [ + | - ]`',
    '',
    'Tests, sets (`+`), or clears (`-`) rc command-line flag `f`. Some flags can only be tested.',
  ].join('\n'),
  limit: [
    '**rc builtin:** `limit [-h] [resource [value]]`',
    '',
    'Shows or changes BSD-style process resource limits. `-h` selects hard limits.',
  ].join('\n'),
  newpgrp: [
    '**rc builtin:** `newpgrp`',
    '',
    'Places rc in a new process group.',
  ].join('\n'),
  return: [
    '**rc builtin:** `return [status]`',
    '',
    'Returns from the current function with `status`. If omitted, `$status` is left unchanged. It is an error outside a function.',
  ].join('\n'),
  shift: [
    '**rc builtin:** `shift [n]`',
    '',
    'Deletes `n` elements from the beginning of `$*` and shifts the remaining arguments down. `n` defaults to `1`.',
  ].join('\n'),
  umask: [
    '**rc builtin:** `umask [mask]`',
    '',
    'Sets the current file creation mask. With no argument, prints the current mask.',
  ].join('\n'),
  wait: [
    '**rc builtin:** `wait [pid ...]`',
    '',
    'Waits for rc child processes. With pids, appends each status to `$status`; without pids, waits for all children and returns the last status.',
  ].join('\n'),
  whatis: [
    '**rc builtin:** `whatis [-b] [-f] [-p] [-s] [-v] [--] [name ...]`',
    '',
    'Prints rc definitions. It can report builtins, functions, executable paths, signal handlers, and variables. Its output is suitable as rc input.',
  ].join('\n'),
  '~': [
    '**rc pattern command:** `~ subject pattern ...`',
    '',
    'Succeeds when `subject` matches one of the rc patterns. Unlike filename globbing, patterns are matched against the supplied strings.',
  ].join('\n'),
}

export function documentationFor(word: string): string | null {
  return DOCUMENTATION[word] ?? null
}
