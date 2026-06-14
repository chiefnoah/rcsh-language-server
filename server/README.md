# rcsh Language Server

Node package for the Plan 9 rc shell language server.

The binary entry point is:

```sh
rcsh-language-server start
```

The runtime parser asset is `tree-sitter-rcsh.wasm`; generate it with
`scripts/upgrade-tree-sitter.sh` from the repository root.
