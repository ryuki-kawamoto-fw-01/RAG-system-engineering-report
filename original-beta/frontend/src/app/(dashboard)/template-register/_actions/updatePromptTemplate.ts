'use server';

import { z } from 'zod';
import { PromptTemplate, PromptTemplateErrors } from '@/app/_types/prompt-template';
import { Result } from '@/app/_types/result';
import { templateContainer } from '../../../../../cosmos';
import { PromptTemplateSchema } from '../_utils/schema';

type Response = Result<PromptTemplateErrors>;

export async function updatePromptTemplate(
  data: z.infer<typeof PromptTemplateSchema>,
  id: string
): Promise<Response> {
  try {
    // TODO: パーティション設定が適切でないため、現状部分更新ができない
    // TODO: そのため、既存データをデフォルト値用に逐一取得している
    // TODO: パフォーマンスが悪いため、パーティンが適切に設定されたら修正する
    const { resources: templates } = await templateContainer.items
      .query<PromptTemplate>({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();

    // TODO: DBのPartitionKeyが「/category」に設定されているため、カテゴリーが変更されるたびに別のデータとして作成されてしまう
    // TODO: そのため、無駄に複製されたデータをここで削除している
    // TODO: バグの温床になりやすいので、PartitionKeyを適切に設定し直す
    // カテゴリーが変更された場合、旧カテゴリーのテンプレートを削除
    if (templates[0].category !== data.category) {
      await templateContainer.item(id, templates[0].category).delete();
    }

    await templateContainer.items.upsert({
      ...templates[0],
      id,
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
