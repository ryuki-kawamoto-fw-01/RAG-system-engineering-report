'use server';

import { Result } from '@/app/_types/result';
import { banWordContainer } from '../../../../../cosmos';
import { BanWordErrors } from '../_type';

type Response = Result<BanWordErrors>;

export async function createBanWord(formData: FormData): Promise<Response> {
  try {
    const data = {
      id: formData.get('id')?.toString() || undefined,
      banWord: formData.get('banWord')?.toString() || '',
      category: formData.get('category')?.toString() || '',
    };

    // banWordとcategoryの組み合わせの一意チェック
    const { resources } = await banWordContainer.items
      .query({
        query:
          'SELECT * FROM c WHERE c.banWord = @banWord AND c.category = @category AND NOT IS_DEFINED(c.deletedAt)',
        parameters: [
          { name: '@banWord', value: data.banWord },
          { name: '@category', value: data.category },
        ],
      })
      .fetchAll();

    if (resources.length > 0) {
      return {
        success: false,
        errors: {
          category: ['この組み合わせは既に登録されています。'],
        },
      };
    }

    await banWordContainer.items.create(data);

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
