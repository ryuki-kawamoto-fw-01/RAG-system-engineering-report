'use server';

import { Result } from '@/app/_types/result';
import { dictionaryContainer } from '../../../../../cosmos';
import { Dictionary, DictionaryErrors } from '../_type';

type Response = Result<DictionaryErrors>;

export async function updateDictionary(formData: FormData, origin: Dictionary): Promise<Response> {
  try {
    const data = {
      id: formData.get('id')?.toString(),
      category: formData.get('category')?.toString(),
      uniform_name: formData.get('uniform_name')?.toString(),
      description: formData.get('description')?.toString(),
      terms: formData.getAll('terms'),
    };

    // 統一名称の一意チェックはサーバーサイドで対応
    const uniformName = data.uniform_name;
    if (uniformName && uniformName !== origin.uniform_name) {
      const { resources } = await dictionaryContainer.items
        .query({
          query:
            'SELECT * FROM c WHERE c.uniform_name = @uniformName AND NOT IS_DEFINED(c.deletedAt)',
          parameters: [{ name: '@uniformName', value: uniformName }],
        })
        .fetchAll();

      if (resources.length > 0) {
        return {
          success: false,
          errors: {
            uniform_name: ['同一の統一名称が既に存在します'],
          },
        };
      }
    }

    // FIXME: DBのPartitionKeyが「/category」に設定されているため、カテゴリーが変更されるたびに新たなデータが作成されてしまう。
    // そのため、古いデータをここで削除している。バグの温床になりやすいので、PartitionKeyを適切に設定し直す。
    if (origin.category !== data.category) {
      await dictionaryContainer.item(origin.id!, origin.category).delete();
    }

    await dictionaryContainer.items.upsert({
      ...origin,
      ...data,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
}
