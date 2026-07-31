'use server';

import { HiyariHatRegisterModel } from '../../../../../config';
import { hiyariHatRegisterContainer } from '../../../../../cosmos';

type Response = {
  hiyariHats: HiyariHatRegisterModel[];
  error?: string;
};

export async function getHiyariHats(): Promise<Response> {
  try {
    const { resources: hiyariHats } = await hiyariHatRegisterContainer.items
      .query<HiyariHatRegisterModel>({
        query: 'SELECT * FROM c WHERE (c.isDeleted = false OR NOT IS_DEFINED(c.isDeleted))',
      })
      .fetchAll();

    return {
      hiyariHats,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    return {
      hiyariHats: [],
      error: `データの取得に失敗しました: ${errorMessage}`,
    };
  }
}
