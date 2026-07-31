'use server';

import { BulkOperationType, OperationInput } from '@azure/cosmos';
import { Result } from '@/app/_types/result';
import { getMessage } from '@/app/_utils/message';
import { useCaseContainer } from '../../../../../cosmos';
import { UseCase } from '../_type';

type Response = Result;

export async function deleteUseCases(useCases: UseCase[]): Promise<Response> {
  try {
    const ids = useCases.map(({ id }) => id).filter((item) => item !== null);

    if (ids.length === 0) {
      return {
        success: false,
        message: getMessage('E_F_00410', 'ユースケース'),
      };
    }

    const query = `SELECT * FROM c WHERE c.id IN(${ids.map((_, i) => `@id${i}`).join(', ')})`;
    const parameters = ids.map((id, i) => ({
      name: `@id${i}`,
      value: id,
    }));

    const { resources } = await useCaseContainer.items
      .query<UseCase>({
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
          message: getMessage('E_F_00410', 'ユースケース', id),
        };
      }

      // 既に削除されている場合
      if (resource.deletedAt !== undefined) {
        return {
          success: false,
          message: getMessage('E_F_00420', 'ユースケース', id),
        };
      }
    }

    const now = new Date().getTime();
    const operations: OperationInput[] = useCases.map((useCase) => ({
      operationType: BulkOperationType.Upsert,
      resourceBody: {
        ...useCase,
        deletedAt: now,
        isDeleted: true,
      },
    }));
    await useCaseContainer.items.bulk(operations);

    return {
      success: true,
      message: getMessage('I_F_00180', 'ユースケース'),
    };
  } catch (error) {
    console.error('Delete use cases error:', error);
    return {
      success: false,
      message: getMessage('E_F_00410', 'ユースケース'),
    };
  }
}
