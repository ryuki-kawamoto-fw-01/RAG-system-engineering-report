import { getPromptTemplates } from '@/app/(dashboard)/chat/[id]/_actions/getPromptTemplates';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('~/cosmos', () => ({
  templateContainer: {
    items: {
      query: jest.fn(),
    },
  },
}));

import { templateContainer } from '~/cosmos';

describe('getPromptTemplates', () => {
  test('N-01-001: type でテンプレートを取得して返す', async () => {
    (templateContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [{ id: 'p1' }, { id: 'p2' }] }),
    });

    const result = await getPromptTemplates('manufacturing');

    expect(result).toEqual([{ id: 'p1' }, { id: 'p2' }]);

    const callArg = (templateContainer.items.query as jest.Mock).mock.calls[0][0];
    expect(callArg.parameters).toEqual([{ name: '@type', value: 'manufacturing' }]);
    expect(callArg.query).toEqual(expect.stringContaining('c.type = @type'));
    expect(callArg.query).toEqual(expect.stringContaining('OFFSET 0 LIMIT 6'));
  });

  test('I-01-001: query→fetchAll の結果がそのまま返る', async () => {
    const fetchAll = jest.fn().mockResolvedValue({ resources: [{ id: 'p1' }] });
    (templateContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

    const result = await getPromptTemplates('manufacturing');

    expect(fetchAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'p1' }]);
  });

  test('L-01-001: type が空文字でも parameters に反映される', async () => {
    (templateContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    const result = await getPromptTemplates('');

    expect(result).toEqual([]);
    const callArg = (templateContainer.items.query as jest.Mock).mock.calls[0][0];
    expect(callArg.parameters).toEqual([{ name: '@type', value: '' }]);
  });

  test('E-01-001: query が例外を投げた場合は伝播する', async () => {
    (templateContainer.items.query as jest.Mock).mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(getPromptTemplates('manufacturing')).rejects.toThrow('boom');
  });
});
