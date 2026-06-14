# rcsh Language Server

Language server for the Plan 9 rc shell, forked from bash-language-server.

This fork keeps the LSP features that still make sense for rc:

- document symbols for `fn name` and `name = ...`
- completion for rc keywords, builtins, executables, snippets, and known symbols
- hover/definition/references/rename for functions and variables
- background workspace symbol indexing for `.rcsh` files
- source following for constant `. file` commands

ShellCheck, shfmt, and Bash-completion-backed option completion were removed because
they do not understand rc.

## Parser

The server loads `server/tree-sitter-rcsh.wasm`. Generate it with:

```sh
sh scripts/upgrade-tree-sitter.sh /path/to/tree-sitter-rcsh
```

The script also accepts `TREE_SITTER_RCSH_PATH`; otherwise it defaults to
`$HOME/repos/tree-sitter-rcsh`.

## Development

```sh
pnpm compile
pnpm test
```
