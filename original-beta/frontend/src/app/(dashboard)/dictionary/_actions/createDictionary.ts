'use server';

import { Result } from '@/app/_types/result';
import { dictionaryContainer } from '../../../../../cosmos';
import { DictionaryErrors } from '../_type';

type Response = Result<DictionaryErrors>;

export async function createDictionary(formData: FormData): Promise<Response> {
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
    if (uniformName) {
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

    await dictionaryContainer.items.create(data);

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
