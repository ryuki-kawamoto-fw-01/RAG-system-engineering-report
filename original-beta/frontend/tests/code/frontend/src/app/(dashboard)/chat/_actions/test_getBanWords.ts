import { getBanWords } from '@/app/(dashboard)/chat/_actions/getBanWord';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('~/cosmos', () => ({
  banWordContainer: {
    items: {
      query: jest.fn(),
    },
  },
}));

import { banWordContainer } from '~/cosmos';

describe('getBanWords', () => {
  test('N-01-001: deletedAt 未定義の禁止ワード一覧を返す', async () => {
    (banWordContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [{ id: 'b1' }, { id: 'b2' }] }),
    });

    const result = await getBanWords();

    expect(result).toEqual({ banWords: [{ id: 'b1' }, { id: 'b2' }] });
    expect(banWordContainer.items.query).toHaveBeenCalledWith({
      query: 'SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)',
    });
  });

  test('I-01-001: fetchAll が1回呼ばれ、返却値が banWords に入る', async () => {
    const fetchAll = jest.fn().mockResolvedValue({ resources: [{ id: 'b1' }] });
    (banWordContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

    const result = await getBanWords();

    expect(fetchAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ banWords: [{ id: 'b1' }] });
  });

  test('L-01-001: 該当0件の場合は空配列を返す', async () => {
    (banWordContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    const result = await getBanWords();

    expect(result).toEqual({ banWords: [] });
  });

  test('E-01-001: 例外は呼び出し元へ伝播する', async () => {
    (banWordContainer.items.query as jest.Mock).mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(getBanWords()).rejects.toThrow('boom');
  });
});
