'use server';

import { z } from 'zod';
import { Result } from '@/app/_types/result';
import { qaContainer } from '../../../../../cosmos';
import { QA, QAErrors } from '../_type';
import { QASchema } from '../_utils/schema';

type Response = Result<QAErrors>;

export async function updateQA(data: z.infer<typeof QASchema>, origin: QA): Promise<Response> {
  try {
    // FIXME: DBのPartitionKeyが「/category」に設定されているため、カテゴリーが変更されるたびに新たなデータが作成されてしまう。
    // そのため、古いデータをここで削除している。バグの温床になりやすいので、PartitionKeyを適切に設定し直す。
    if (origin.category !== data.category) {
      await qaContainer.item(origin.id!, origin.category).delete();
    }

    await qaContainer.items.upsert({
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
