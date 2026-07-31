import { SendChatInputSchema } from '@/app/_schemas/send-chat';

describe('SendChatInputSchema', () => {
  const buildMessage = (overrides: Partial<{ id: string; role: any; content: any }> = {}) => ({
    id: 'm1',
    role: 'user' as const,
    content: 'hello',
    ...overrides,
  });

  const buildBase = (overrides: Record<string, unknown> = {}) => ({
    id: 'thread-1',
    model: 'gpt-test',
    messages: [buildMessage()],
    ...overrides,
  });

  describe('正常系テスト', () => {
    test('N-01-001: chatモードの最小入力でparseに成功する', () => {
      const result = SendChatInputSchema.parse(buildBase({ mode: 'chat' }));
      expect(result).toEqual(
        expect.objectContaining({
          id: 'thread-1',
          mode: 'chat',
          model: 'gpt-test',
        })
      );
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toEqual(
        expect.objectContaining({ role: 'user', content: 'hello' })
      );
    });

    test('N-01-002: ragモードでcategory未指定でもparseに成功する', () => {
      const result = SendChatInputSchema.parse(
        buildBase({
          mode: 'rag',
          searchMethod: 'hybrid',
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          mode: 'rag',
          searchMethod: 'hybrid',
        })
      );
      expect('category' in result).toBe(false);
    });

    test('N-01-003: ragモードでcategory指定時にparseに成功する', () => {
      const result = SendChatInputSchema.parse(
        buildBase({
          mode: 'rag',
          searchMethod: 'hybrid',
          category: 'cat-a',
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          mode: 'rag',
          searchMethod: 'hybrid',
          category: 'cat-a',
        })
      );
    });

    test('N-01-004: fileUrl/fileName/mediaType/templateId を指定してもparseに成功する', () => {
      const result = SendChatInputSchema.parse(
        buildBase({
          mode: 'chat',
          fileUrl: 'https://example.com/file.pdf',
          fileName: 'file.pdf',
          mediaType: 'application/pdf',
          templateId: 'tpl-1',
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          mode: 'chat',
          fileUrl: 'https://example.com/file.pdf',
          fileName: 'file.pdf',
          mediaType: 'application/pdf',
          templateId: 'tpl-1',
        })
      );
    });

    test('N-01-005: 最後のメッセージcontentが空白のみでもrefineは通る（現仕様の確認）', () => {
      const result = SendChatInputSchema.parse(
        buildBase({
          mode: 'chat',
          messages: [buildMessage({ content: ' ' })],
        })
      );
      expect(result.messages[result.messages.length - 1].content).toBe(' ');
    });

    test('N-01-006: 最後がuserであれば、その前にassistantがいてもparseに成功する', () => {
      const result = SendChatInputSchema.parse(
        buildBase({
          mode: 'chat',
          messages: [
            buildMessage({ id: 'm1', role: 'user', content: 'q1' }),
            buildMessage({ id: 'm2', role: 'assistant', content: 'a1' }),
            buildMessage({ id: 'm3', role: 'user', content: 'q2' }),
          ],
        })
      );
      expect(result.messages[result.messages.length - 1]).toEqual(
        expect.objectContaining({ role: 'user', content: 'q2' })
      );
    });
  });

  describe('異常系テスト', () => {
    test('E-01-001: messagesが空配列の場合はエラーになる（min(1)）', () => {
      const result = SendChatInputSchema.safeParse(buildBase({ mode: 'chat', messages: [] }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.message.includes('messagesは1個以上必要です。'))
        ).toBe(true);
      }
    });

    test('E-01-002: 最後のメッセージcontentが空文字の場合はrefineでエラーになる', () => {
      const result = SendChatInputSchema.safeParse(
        buildBase({
          mode: 'chat',
          messages: [buildMessage({ content: '' })],
        })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.message === '最後のメッセージはcontentが必要です。')
        ).toBe(true);
      }
    });

    test('E-01-003: 最後のメッセージroleがuser以外の場合はrefineでエラーになる', () => {
      const result = SendChatInputSchema.safeParse(
        buildBase({
          mode: 'chat',
          messages: [buildMessage({ role: 'assistant' })],
        })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (i) => i.message === '最後のメッセージはroleがuserである必要があります。'
          )
        ).toBe(true);
      }
    });

    test('E-01-004: ragモードでsearchMethod未指定の場合はエラーになる', () => {
      const result = SendChatInputSchema.safeParse(buildBase({ mode: 'rag' }));
      expect(result.success).toBe(false);
    });
  });

  describe('境界系テスト', () => {
    test('L-01-001: fileUrlが空文字でもstringとして許容される', () => {
      const result = SendChatInputSchema.parse(
        buildBase({
          mode: 'chat',
          fileUrl: '',
        })
      );
      expect(result.fileUrl).toBe('');
    });

    test('L-01-002: categoryが空文字でもstringとして許容される', () => {
      const result = SendChatInputSchema.parse(
        buildBase({
          mode: 'rag',
          searchMethod: 'hybrid',
          category: '',
        })
      );
      expect(result.category).toBe('');
    });
  });

  describe('モジュール疎通系テスト', () => {
    test('I-01-001: unionとrefineが同時に成立し、safeParseがsuccess=trueになる', () => {
      const result = SendChatInputSchema.safeParse(
        buildBase({
          mode: 'rag',
          searchMethod: 'hybrid',
          messages: [
            buildMessage({ id: 'm1', role: 'user', content: 'q1' }),
            buildMessage({ id: 'm2', role: 'assistant', content: 'a1' }),
            buildMessage({ id: 'm3', role: 'user', content: 'q2' }),
          ],
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
