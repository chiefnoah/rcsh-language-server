#!/usr/bin/env bash

set -euox pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
grammar_path="${1:-${TREE_SITTER_RCSH_PATH:-$HOME/repos/tree-sitter-rcsh}}"

if ! [ -d "$grammar_path" ]; then
	echo "tree-sitter-rcsh grammar not found: $grammar_path" >&2
	exit 1
fi

make -C "$grammar_path" wasm-nix
cp "$grammar_path/tree-sitter-rcsh.wasm" "$repo_root/server/tree-sitter-rcsh.wasm"

git -C "$grammar_path" remote get-url origin > "$repo_root/server/parser.info"
git -C "$grammar_path" rev-parse HEAD >> "$repo_root/server/parser.info"
echo 'tree-sitter-cli "0.24.7"' >> "$repo_root/server/parser.info"
