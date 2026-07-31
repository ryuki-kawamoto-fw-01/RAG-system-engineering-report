export type AnswerBlock = { type: 'markdown' | 'mermaid'; content: string };

export function parseAnswer(answer: string): AnswerBlock[] {
  const regex = /```mermaid\s*([\s\S]*?)```/g;
  const result: AnswerBlock[] = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(answer)) !== null) {
    if (match.index > lastIndex) {
      result.push({
        type: 'markdown',
        content: answer.slice(lastIndex, match.index),
      });
    }
    result.push({
      type: 'mermaid',
      content: match[1],
    });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < answer.length) {
    result.push({
      type: 'markdown',
      content: answer.slice(lastIndex),
    });
  }
  return result;
}
