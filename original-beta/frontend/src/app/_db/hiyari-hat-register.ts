import { HiyariHatRegisterModel } from '../../../config';
import { hiyariHatRegisterContainer } from '../../../cosmos';
import { uniqueId } from '../_utils/uniqueId';

export async function getAllHiyariHatRegisters(): Promise<HiyariHatRegisterModel[]> {
  try {
    const { resources: hiyariHatRegisters } = await hiyariHatRegisterContainer.items
      .query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE (c.isDeleted = false OR NOT IS_DEFINED(c.isDeleted))',
      })
      .fetchAll();

    // データの正規化（フィールド名の統一）
    const normalizedData = hiyariHatRegisters.map((item) => ({
      id: item.id as string,
      category: (item.category as string) || '',
      incident: (item.incident as string) || '',
      counterMeasure: (item.counterMeasure as string) || (item.countermeasure as string) || '',
      isDeleted: typeof item.isDeleted === 'boolean' ? item.isDeleted : false,
    }));

    return normalizedData;
  } catch {
    throw new Error('ヒヤリハット登録データの取得に失敗しました');
  }
}

export async function getHiyariHatRegisterById(id: string): Promise<HiyariHatRegisterModel | null> {
  try {
    const { resources } = await hiyariHatRegisterContainer.items
      .query<Record<string, unknown>>({
        query:
          'SELECT * FROM c WHERE c.id = @id AND (c.isDeleted = false OR NOT IS_DEFINED(c.isDeleted))',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();

    if (!resources || resources.length === 0) {
      return null;
    }

    const item = resources[0];

    // データの正規化（フィールド名の統一）
    const normalizedData: HiyariHatRegisterModel = {
      id: item.id as string,
      category: (item.category as string) || '',
      incident: (item.incident as string) || '',
      counterMeasure: (item.counterMeasure as string) || (item.countermeasure as string) || '',
      isDeleted: typeof item.isDeleted === 'boolean' ? item.isDeleted : false,
    };

    return normalizedData;
  } catch {
    throw new Error('ヒヤリハット登録データの取得に失敗しました');
  }
}

export async function createHiyariHatRegisterDB(
  data: Omit<HiyariHatRegisterModel, 'id'>
): Promise<string> {
  try {
    const id = uniqueId();

    const hiyariHatData: HiyariHatRegisterModel = {
      id,
      category: data.category || '',
      incident: data.incident || '',
      counterMeasure: data.counterMeasure || '',
      isDeleted: false,
    };

    await hiyariHatRegisterContainer.items.create(hiyariHatData);

    return id;
  } catch (error) {
    throw new Error(
      `ヒヤリハット登録データの作成に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function updateHiyariHatRegisterDB(
  id: string,
  updates: Partial<HiyariHatRegisterModel>
): Promise<void> {
  try {
    const { resource: existing } = await hiyariHatRegisterContainer.item(id, id).read();
    if (!existing || existing.isDeleted === true) {
      throw new Error('更新対象のヒヤリハット登録データが見つかりません');
    }

    const updatedHiyariHat = {
      ...existing,
      ...updates,
      id, // IDは変更不可
      // フィールド名の統一
      counterMeasure:
        updates.counterMeasure || existing.counterMeasure || existing.countermeasure || '',
    };

    await hiyariHatRegisterContainer.item(id, id).replace(updatedHiyariHat);
  } catch (error) {
    throw new Error(
      `ヒヤリハット登録データの更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function deleteHiyariHatRegisterDB(id: string): Promise<void> {
  try {
    const { resource: existing } = await hiyariHatRegisterContainer.item(id, id).read();
    if (!existing) {
      throw new Error('削除対象のヒヤリハット登録データが見つかりません');
    }

    if (existing.isDeleted === true) {
      throw new Error('指定されたヒヤリハット登録データは既に削除されています');
    }

    const updatedHiyariHat = {
      ...existing,
      isDeleted: true,
    };

    await hiyariHatRegisterContainer.item(id, id).replace(updatedHiyariHat);
  } catch (error) {
    throw new Error(
      `ヒヤリハット登録データの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
