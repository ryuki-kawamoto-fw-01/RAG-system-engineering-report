'use server';

import { Result } from '@/app/_types/result';
import { banWordContainer } from '../../../../../cosmos';
import { BanWord, BanWordErrors } from '../_type';

type Response = Result<BanWordErrors>;

export async function updateBanWord(formData: FormData, origin: BanWord): Promise<Response> {
  try {
    const data = {
      id: formData.get('id')?.toString(),
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

    // FIXME: DBのPartitionKeyが「/category」に設定されているため、カテゴリーが変更されるたびに新たなデータが作成されてしまう。
    // そのため、古いデータをここで削除している。バグの温床になりやすいので、PartitionKeyを適切に設定し直す。
    if (origin.category !== data.category) {
      await banWordContainer.item(origin.id!, origin.category).delete();
    }

    await banWordContainer.items.upsert({
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
