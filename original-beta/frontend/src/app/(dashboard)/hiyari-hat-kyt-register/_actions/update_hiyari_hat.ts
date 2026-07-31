'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Result } from '@/app/_types/result';
import { HiyariHatRegisterModel } from '../../../../../config';
import { hiyariHatRegisterContainer } from '../../../../../cosmos';
import { hiyariHatRegisterSchema } from '../_utils/schima';

type HiyariHatRegisterErrors = z.inferFlattenedErrors<
  typeof hiyariHatRegisterSchema
>['fieldErrors'];

type Response = Result<HiyariHatRegisterErrors>;

export async function updateHiyariHat(
  data: z.infer<typeof hiyariHatRegisterSchema>,
  origin: HiyariHatRegisterModel
): Promise<Response> {
  try {
    if (!origin.id) {
      return {
        success: false,
        message: '更新対象のIDが見つかりません',
      };
    }

    // FIXME: DBのPartitionKeyが「/category」に設定されている可能性があります。
    // カテゴリーが変更された場合、古いデータを削除して新しいデータを作成する必要があります。
    if (origin.category !== data.category) {
      try {
        await hiyariHatRegisterContainer.item(origin.id, origin.category).delete();
      } catch (deleteError) {
        console.warn('古いデータの削除に失敗しました:', deleteError);
        // 削除に失敗してもupsertは続行
      }
    }

    // 既存のドキュメントを更新（新規作成ではなく）
    const updatedData = {
      ...origin,
      category: data.category,
      incident: data.incident,
      counterMeasure: data.counterMeasure,
    };

    // upsertを使用
    await hiyariHatRegisterContainer.items.upsert(updatedData);

    revalidatePath('/hiyari-hat-kyt-register');

    return {
      success: true,
    };
  } catch (error) {
    console.error('ヒヤリハット更新エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    return {
      success: false,
      message: `更新処理に失敗しました: ${errorMessage}`,
    };
  }
}
