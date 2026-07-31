/**
 * ロジックツリーテキストをフォーマットする関数
 * @param text フォーマットするテキスト
 * @returns フォーマット済みのテキスト
 */
export function formatLogicTree(text: string): string {
  const lines = text.trim().split('\n');
  const firstLine = lines[0];
  const restLines = lines.slice(1).join('\n');
  const formattedRest = restLines.replace(/【[^】]+】/g, (match) => `\n${match}\n\n   ・`);
  return `${firstLine}\n${formattedRest}`;
}

/**
 * マークダウンテキストをフォーマットする関数
 * @param text フォーマットするテキスト
 * @returns フォーマット済みのテキスト
 */
export function formatMarkdownText(text: string): string {
  if (!text) return '';
  const formatted = text.replace(/\*\s{2,}/g, '*');
  return formatted;
}
