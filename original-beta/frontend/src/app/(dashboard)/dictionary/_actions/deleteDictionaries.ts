'use server';

import { BulkOperationType, OperationInput } from '@azure/cosmos';
import { Result } from '@/app/_types/result';
import { getMessage } from '@/app/_utils/message';
import { dictionaryContainer } from '../../../../../cosmos';
import { Dictionary } from '../_type';

type Response = Result;

export async function deleteDictionaries(dictionaries: Dictionary[]): Promise<Response> {
  try {
    const ids = dictionaries.map(({ id }) => id).filter((item) => item !== null);
    const query = `SELECT * FROM c WHERE c.id IN (${ids.map((_, i) => `@id${i}`).join(', ')})`;
    const parameters = ids.map((id, i) => ({
      name: `@id${i}`,
      value: id,
    }));

    const { resources } = await dictionaryContainer.items
      .query<Dictionary>({
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
          message: getMessage('E_F_00410', '辞書', id),
        };
      }

      // 既に削除されている場合
      if (resource.deletedAt !== undefined) {
        return {
          success: false,
          message: getMessage('E_F_00420', '辞書', id),
        };
      }
    }

    const now = new Date().getTime();
    const operations: OperationInput[] = dictionaries.map((dictionary) => ({
      operationType: BulkOperationType.Upsert,
      resourceBody: {
        ...dictionary,
        deletedAt: now,
      },
    }));
    await dictionaryContainer.items.bulk(operations);

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
