import * as LSP from 'vscode-languageserver/node'

export enum CompletionItemDataType {
  Builtin,
  Executable,
  ReservedWord,
  Symbol,
  Snippet,
}

export interface RcCompletionItem extends LSP.CompletionItem {
  data: {
    type: CompletionItemDataType
  }
}
