'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Result } from '@/app/_types/result';
import { uniqueId } from '@/app/_utils/uniqueId';
import { hiyariHatRegisterContainer } from '../../../../../cosmos';
import { hiyariHatRegisterSchema } from '../_utils/schima';

type HiyariHatRegisterErrors = z.inferFlattenedErrors<
  typeof hiyariHatRegisterSchema
>['fieldErrors'];

type Response = Result<HiyariHatRegisterErrors>;

export async function createHiyariHat(
  data: z.infer<typeof hiyariHatRegisterSchema>
): Promise<Response> {
  try {
    // プロパティの順番を明示的に制御
    const hiyariHatData = {
      id: uniqueId(),
      category: data.category || '',
      incident: data.incident || '',
      counterMeasure: data.counterMeasure || '',
      isDeleted: false,
    };

    await hiyariHatRegisterContainer.items.create(hiyariHatData);

    revalidatePath('/hiyari-hat-kyt-register');

    return {
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    return {
      success: false,
      message: `登録処理に失敗しました: ${errorMessage}`,
    };
  }
}
