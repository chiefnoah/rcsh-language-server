# Contributing to rcsh Language Server

## Development

Install dependencies and run the focused verification suite from the repository
root:

```sh
pnpm install
pnpm compile
pnpm test
```

The server parser is generated from `tree-sitter-rcsh`:

```sh
sh scripts/upgrade-tree-sitter.sh /path/to/tree-sitter-rcsh
```

Keep changes scoped to rc semantics. Avoid reintroducing integrations for tools
that do not parse Plan 9 rc.
