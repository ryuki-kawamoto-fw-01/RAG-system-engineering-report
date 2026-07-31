'use server';
import 'server-only';
import { banWordContainer } from '../../../../../cosmos';
export async function getBanWords() {
  //禁止ワードを取得
  const { resources: banWords } = await banWordContainer.items
    .query({
      query: 'SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)',
    })
    .fetchAll();
  return {
    banWords,
  };
}
