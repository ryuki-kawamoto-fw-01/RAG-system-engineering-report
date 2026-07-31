import { MODEL_VALUES } from '~/config';

import { SettingFormSchema } from '@/app/(dashboard)/chat/[id]/_utils/schema';

describe('SettingFormSchema', () => {
  test('N-01-001: 許可された model 値は parse に成功する', () => {
    const result = SettingFormSchema.parse({ model: MODEL_VALUES[0] });
    expect(result).toEqual({ model: MODEL_VALUES[0] });
  });

  test('L-01-001: 許可された model の末尾要素でも parse に成功する', () => {
    const last = MODEL_VALUES[MODEL_VALUES.length - 1];
    const result = SettingFormSchema.parse({ model: last });
    expect(result).toEqual({ model: last });
  });

  test('E-01-001: 許可されない model はエラーになる（メッセージ含む）', () => {
    const result = SettingFormSchema.safeParse({ model: 'not-allowed-model' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('許可されたモデルを選択してください');
    }
  });

  test('E-01-002: model が未指定ならエラーになる', () => {
    const result = SettingFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
