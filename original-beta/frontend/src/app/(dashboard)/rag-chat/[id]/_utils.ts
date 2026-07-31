import { Message as ChatMessage } from 'ai/react';

type RefAns = {
  text: string;
  citation: {
    rawdata_name: string;
    rawdata_path: string;
    pagedata_path: string;
  }[];
};

// FIXME: Messageの型があちこちに散らばっているので型をまとめたい
// chat,rag-chatをリファクタリングするときに一緒にやりたい
type Message = ChatMessage & {
  refAns?: RefAns[];
};

export const buildMessages = (messages: Message[]) => {
  return messages.map((message) => buildMessageMarkdown(message));
};

const buildMessageMarkdown = (message: Message) => {
  if (!message.refAns || message.refAns.length === 0) {
    return message;
  }

  // 文末に注釈を追加
  const mainContent = message.refAns
    .map((item, index) => {
      const citationMark =
        item.citation.length > 0
          ? `[[^${index + 1}]](# "${item.citation[0].rawdata_name}|${item.citation[0].rawdata_path}|${item.citation[0].pagedata_path}")`
          : '';
      return `${item.text}${citationMark}\n\n`;
    })
    .join('');

  const citations = message.refAns.flatMap((item, index) =>
    item.citation.map((cit) => ({
      index: index + 1,
      rawdata_name: cit.rawdata_name,
      rawdata_path: cit.rawdata_path,
      pagedata_path: cit.pagedata_path,
    }))
  );

  // 引用リンク先リストを作成
  const citationContent =
    citations.length > 0
      ? '\n\n---\n\n**引用元：**\n\n' +
        citations
          .map(
            (cit) =>
              `[^${cit.index}]: [${cit.rawdata_name}](# "${cit.rawdata_name}|${cit.rawdata_path}|${cit.pagedata_path}")`
          )
          .join('\n\n')
      : '';

  const content = mainContent + citationContent;

  return {
    ...message,
    content,
  };
};
