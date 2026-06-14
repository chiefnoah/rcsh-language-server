import { CompletionItemKind, InsertTextFormat, MarkupKind } from 'vscode-languageserver'

import { RcCompletionItem, CompletionItemDataType } from './types'

export const SNIPPETS: RcCompletionItem[] = [
  {
    documentation: 'rc shebang',
    label: 'shebang',
    insertText: '#!/usr/bin/env rc',
  },
  {
    label: 'fn',
    documentation: 'function definition',
    insertText: ['fn ${1:name} {', '\t${2:command ...}', '}'].join('\n'),
  },
  {
    label: 'for',
    documentation: 'for loop',
    insertText: ['for(${1:name} in ${2:items}) {', '\t${3:command ...}', '}'].join('\n'),
  },
  {
    label: 'if',
    documentation: 'if block',
    insertText: ['if(${1:condition}) {', '\t${2:command ...}', '}'].join('\n'),
  },
  {
    label: 'if-else',
    documentation: 'if else block',
    insertText: [
      'if(${1:condition}) {',
      '\t${2:command ...}',
      '} else {',
      '\t${3:command ...}',
      '}',
    ].join('\n'),
  },
  {
    label: 'while',
    documentation: 'while loop',
    insertText: ['while(${1:condition}) {', '\t${2:command ...}', '}'].join('\n'),
  },
  {
    label: 'switch',
    documentation: 'switch block',
    insertText: [
      'switch($${1:var}) {',
      'case ${2:pattern}',
      '\t${3:command ...}',
      '}',
    ].join('\n'),
  },
].map((snippet) => ({
  ...snippet,
  insertTextFormat: InsertTextFormat.Snippet,
  kind: CompletionItemKind.Snippet,
  data: { type: CompletionItemDataType.Snippet },
  documentation: {
    kind: MarkupKind.Markdown,
    value: snippet.documentation,
  },
}))
