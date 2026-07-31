import { Message as ChatMessage } from 'ai/react';

type RefAns = {
  text: string;
  citation: {
    search_title: string;
    search_filepath: string;
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
          ? `[[^${index + 1}]](# "${item.citation[0].search_title}|${item.citation[0].search_filepath}")`
          : '';
      return `${item.text}${citationMark}\n\n`;
    })
    .join('');

  const citations = message.refAns.flatMap((item, index) =>
    item.citation.map((cit) => ({
      index: index + 1,
      search_title: cit.search_title,
      search_filepath: cit.search_filepath,
    }))
  );

  // 引用リンク先リストを作成
  const citationContent =
    citations.length > 0
      ? '\n\n---\n\n**引用元：**\n\n' +
        citations
          .map(
            (cit) =>
              `[^${cit.index}]: [${cit.search_title}](# "${cit.search_title}|${cit.search_filepath}")`
          )
          .join('\n\n')
      : '';

  const content = mainContent + citationContent;

  return {
    ...message,
    content,
  };
};
