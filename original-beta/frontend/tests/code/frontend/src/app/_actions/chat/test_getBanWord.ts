import { getBanWords } from '@/app/_actions/chat/getBanWord';
import { banWordContainer } from '~/cosmos';

jest.mock('~/cosmos', () => ({
  banWordContainer: {
    items: {
      query: jest.fn(),
    },
  },
}));

describe('getBanWords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系テスト', () => {
    test('N-01-001: 禁止ワード一覧を取得して返却すること', async () => {
      const fetchAll = jest.fn().mockResolvedValue({
        resources: [{ id: 'bw-1', word: 'foo' }],
      });
      (banWordContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

      const res = await getBanWords();

      expect(banWordContainer.items.query).toHaveBeenCalledWith({
        query: 'SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)',
      });
      expect(res.banWords).toEqual([{ id: 'bw-1', word: 'foo' }]);
    });
  });

  describe('異常系テスト', () => {
    test('E-01-001: fetchAllが例外を投げた場合は例外が伝播すること', async () => {
      const fetchAll = jest.fn().mockRejectedValue(new Error('cosmos error'));
      (banWordContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

      await expect(getBanWords()).rejects.toThrow('cosmos error');
    });
  });

  describe('境界系テスト', () => {
    test('L-01-001: 0件の場合は空配列を返すこと', async () => {
      const fetchAll = jest.fn().mockResolvedValue({ resources: [] });
      (banWordContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

      const res = await getBanWords();
      expect(res.banWords).toEqual([]);
    });
  });

  describe('モジュール疎通系テスト', () => {
    test('I-01-001: query→fetchAll→戻り値整形の流れが成立すること', async () => {
      const fetchAll = jest.fn().mockResolvedValue({ resources: [{ id: 'bw-1' }] });
      (banWordContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

      const res = await getBanWords();

      expect(fetchAll).toHaveBeenCalled();
      expect(res).toEqual({ banWords: [{ id: 'bw-1' }] });
    });
  });
});
