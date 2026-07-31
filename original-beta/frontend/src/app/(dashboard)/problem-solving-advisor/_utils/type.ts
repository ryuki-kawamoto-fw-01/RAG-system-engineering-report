export type ChatResponse = {
  content: string;
  isSummary?: boolean;
  logicTree?: string;
  advice?: string;
  summary?: string;
  // 他の既存プロパティ
};

export type SendChatResponseData = {
  content: string;
  isSummary?: boolean;
  logicTree?: string;
  advice?: string;
  summary?: string;
  searchResults?: unknown[];
  receivedFileText?: string;
  refAns?: string;
  refText?: string;
};
