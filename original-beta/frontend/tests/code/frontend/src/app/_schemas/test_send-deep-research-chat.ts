import { SendDeepResearchInputSchema } from '@/app/_schemas/send-deep-research-chat';

describe('SendDeepResearchInputSchema', () => {
  const buildMessage = (overrides: Partial<{ id: string; role: any; content: any }> = {}) => ({
    id: 'm1',
    role: 'user' as const,
    content: 'hello',
    ...overrides,
  });

  const buildBase = (overrides: Record<string, unknown> = {}) => ({
    id: 'thread-1',
    mode: 'deep-research' as const,
    messages: [buildMessage()],
    ...overrides,
  });

  describe('正常系テスト', () => {
    test('N-01-001: 最小入力でparseに成功する', () => {
      const result = SendDeepResearchInputSchema.parse(buildBase());
      expect(result).toEqual(
        expect.objectContaining({
          id: 'thread-1',
          mode: 'deep-research',
        })
      );
      expect(result.messages).toHaveLength(1);
    });

    test('N-01-002: 最後がuserなら途中にassistantがいてもparseに成功する', () => {
      const result = SendDeepResearchInputSchema.parse(
        buildBase({
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

    test('N-01-003: 最後のメッセージcontentが空白のみでもrefineは通る（現仕様の確認）', () => {
      const result = SendDeepResearchInputSchema.parse(
        buildBase({
          messages: [buildMessage({ content: ' ' })],
        })
      );
      expect(result.messages[0].content).toBe(' ');
    });
  });

  describe('異常系テスト', () => {
    test('E-01-001: messagesが空配列の場合はエラーになる（min(1)）', () => {
      const result = SendDeepResearchInputSchema.safeParse(buildBase({ messages: [] }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.message.includes('messagesは1個以上必要です。'))
        ).toBe(true);
      }
    });

    test('E-01-002: 最後のメッセージcontentが空文字の場合はrefineでエラーになる', () => {
      const result = SendDeepResearchInputSchema.safeParse(
        buildBase({
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
      const result = SendDeepResearchInputSchema.safeParse(
        buildBase({
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
  });

  describe('境界系テスト', () => {
    test('L-01-001: idが空文字でもstringとして許容される', () => {
      const result = SendDeepResearchInputSchema.parse(buildBase({ id: '' }));
      expect(result.id).toBe('');
    });

    test('L-01-002: idが非常に長い文字列でもstringとして許容される', () => {
      const longId = 'x'.repeat(1000);
      const result = SendDeepResearchInputSchema.parse(buildBase({ id: longId }));
      expect(result.id).toBe(longId);
    });
  });

  describe('モジュール疎通系テスト', () => {
    test('I-01-001: safeParseでsuccess=trueになる（refine含む）', () => {
      const result = SendDeepResearchInputSchema.safeParse(
        buildBase({
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
