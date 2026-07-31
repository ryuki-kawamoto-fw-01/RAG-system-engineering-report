'use server';

import { BulkOperationType, OperationInput } from '@azure/cosmos';
import { Result } from '@/app/_types/result';
import { HiyariHatRegisterModel } from '../../../../../config';
import { hiyariHatRegisterContainer } from '../../../../../cosmos';

type Response = Result;

export async function deleteHiyariHats(items: HiyariHatRegisterModel[]): Promise<Response> {
  try {
    const ids = items
      .map(({ id }) => id)
      .filter((item) => item !== null && item !== undefined && item !== '');

    if (ids.length === 0) {
      return {
        success: false,
        message: '削除対象のIDが見つかりません。',
      };
    }

    // データベースクエリ実行（パーティションキーを考慮）
    const foundResources: HiyariHatRegisterModel[] = [];

    for (const item of items) {
      const query = `SELECT * FROM c WHERE c.id = @id AND c.category = @category`;
      const parameters = [
        { name: '@id', value: String(item.id) },
        { name: '@category', value: item.category },
      ];

      const { resources } = await hiyariHatRegisterContainer.items
        .query<HiyariHatRegisterModel>({
          query,
          parameters,
        })
        .fetchAll();

      if (resources.length > 0) {
        foundResources.push(...resources);
      }
    }

    // 見つからないデータの確認
    for (const item of items) {
      const resource = foundResources.find((res) => String(res.id) === String(item.id));

      if (resource === undefined) {
        return {
          success: false,
          message: `削除対象のヒヤリハット登録データが見つかりません。`,
        };
      }

      if (resource.isDeleted === true) {
        return {
          success: false,
          message: `指定されたデータは既に削除済みです。`,
        };
      }
    }

    // Bulk操作実行
    const operations: OperationInput[] = items.map((item) => ({
      operationType: BulkOperationType.Upsert,
      resourceBody: {
        ...item,
        isDeleted: true,
      },
    }));

    await hiyariHatRegisterContainer.items.bulk(operations);

    return {
      success: true,
      message: `${ids.length}件のデータを正常に削除しました`,
    };
  } catch (error) {
    console.error('ヒヤリハット削除エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';

    return {
      success: false,
      message: `削除処理でエラーが発生しました: ${errorMessage}`,
    };
  }
}
