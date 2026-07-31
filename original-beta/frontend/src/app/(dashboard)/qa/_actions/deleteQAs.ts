'use server';

import { BulkOperationType, OperationInput } from '@azure/cosmos';
import { Result } from '@/app/_types/result';
import { getMessage } from '@/app/_utils/message';
import { qaContainer } from '../../../../../cosmos';
import { QA } from '../_type';

type Response = Result;

export async function deleteQAs(qas: QA[]): Promise<Response> {
  try {
    const ids = qas.map(({ id }) => id).filter((item) => item !== null);
    const query = `SELECT * FROM c WHERE c.id IN(${ids.map((_, i) => `@id${i}`).join(', ')})`;
    const parameters = ids.map((id, i) => ({
      name: `@id${i}`,
      value: id,
    }));

    const { resources } = await qaContainer.items
      .query<QA>({
        query,
        parameters,
      })
      .fetchAll();

    for (const id of ids) {
      const resource = resources.find((item) => item.id === id);
      // データが存在しない場合
      if (resource === undefined) {
        return {
          success: false,
          message: getMessage('E_F_00410', 'Q&A', id),
        };
      }

      // 既に削除されている場合
      if (resource.deletedAt !== undefined) {
        return {
          success: false,
          message: getMessage('E_F_00420', 'Q&A', id),
        };
      }
    }

    const now = new Date().getTime();
    const operations: OperationInput[] = qas.map((qa) => ({
      operationType: BulkOperationType.Upsert,
      resourceBody: {
        ...qa,
        deletedAt: now,
        isDeleted: 'true',
      },
    }));
    await qaContainer.items.bulk(operations);

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
