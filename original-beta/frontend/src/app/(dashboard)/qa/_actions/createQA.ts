'use server';

import { z } from 'zod';
import { Result } from '@/app/_types/result';
import { qaContainer } from '../../../../../cosmos';
import { QAErrors } from '../_type';
import { QASchema } from '../_utils/schema';

type Response = Result<QAErrors>;

export async function createQA(data: z.infer<typeof QASchema>): Promise<Response> {
  try {
    await qaContainer.items.create(data);

    return {
      success: true,
    };
  } catch (error) {
    console.error('QA作成エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    return {
      success: false,
      message: `登録処理に失敗しました: ${errorMessage}`,
    };
  }
}
