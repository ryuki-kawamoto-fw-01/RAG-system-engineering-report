'use server';

import { qaContainer } from '../../../../../cosmos';
import { QA } from '../../qa/_type';

export async function getQA(id: string): Promise<{ qaString: string | null }> {
  try {
    const { resources } = await qaContainer.items
      .query<QA>({
        query: 'SELECT * FROM c WHERE c.id = @id AND NOT IS_DEFINED(c.deletedAt)',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();

    // データが存在しない場合
    if (!resources || resources.length === 0) {
      return { qaString: 'データが見つかりませんでした' };
    }

    const data = resources[0];

    // 指定のstring形式で返す
    const qaString = `
カテゴリー：${data.category}
サブカテゴリー：${data.work_category}

質問：
${data.question}

回答：
${data.answer}`;

    return { qaString };
  } catch (e: unknown) {
    // eがオブジェクトでcodeプロパティを持つ場合のみ判定
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code?: string }).code === 'NotFound'
    ) {
      return { qaString: 'データが見つかりませんでした' };
    }
    // それ以外のエラーは再スロー
    throw e;
  }
}
