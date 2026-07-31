import { getPromptTemplates } from '@/app/_actions/chat/getPromptTemplates';
import { templateContainer } from '~/cosmos';

jest.mock('~/cosmos', () => ({
  templateContainer: {
    items: {
      query: jest.fn(),
    },
  },
}));

describe('getPromptTemplates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (templateContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });
  });

  describe('正常系テスト', () => {
    test('N-01-001: typeを指定してテンプレート一覧を取得できること', async () => {
      const templates = [{ id: 'p-1', type: 'chat', sort: 1, description: 'desc' }];
      const fetchAll = jest.fn().mockResolvedValue({ resources: templates });
      (templateContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

      const res = await getPromptTemplates('chat');

      expect(res).toEqual(templates);
      const callArg = (templateContainer.items.query as jest.Mock).mock.calls[0][0];
      expect(callArg.parameters).toEqual([{ name: '@type', value: 'chat' }]);
      expect(callArg.query).toContain('LIMIT 6');
      expect(callArg.query).toContain('c.type = @type');
      expect(callArg.query).toContain('ORDER BY c.sort ASC');
    });
  });

  describe('異常系テスト', () => {
    test('E-01-001: fetchAllが失敗した場合は例外が伝播すること', async () => {
      (templateContainer.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockRejectedValue(new Error('fetch error')),
      });

      await expect(getPromptTemplates('chat')).rejects.toThrow('fetch error');
    });
  });

  describe('境界系テスト', () => {
    test('L-01-001: typeが空文字でもクエリが実行されること（実装依存の確認）', async () => {
      await getPromptTemplates('');

      const callArg = (templateContainer.items.query as jest.Mock).mock.calls[0][0];
      expect(callArg.parameters).toEqual([{ name: '@type', value: '' }]);
    });
  });

  describe('モジュール疎通系テスト', () => {
    test('I-01-001: query→fetchAll→resources返却の流れが成立すること', async () => {
      const fetchAll = jest.fn().mockResolvedValue({ resources: [{ id: 'p-1' }] });
      (templateContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

      const res = await getPromptTemplates('chat');

      expect(fetchAll).toHaveBeenCalled();
      expect(res).toEqual([{ id: 'p-1' }]);
    });
  });
});
