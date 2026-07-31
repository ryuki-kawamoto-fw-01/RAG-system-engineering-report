'use server';

import { banWordContainer } from '../../../../../cosmos';
import { CATEGORY_VALUES } from '../_constant';
import { BanWord } from '../_type';

type Response = {
  banWords: BanWord[];
};

export async function getBanWords(): Promise<Response> {
  const { resources: banWords } = await banWordContainer.items
    .query<BanWord>({
      query: 'SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)',
    })
    .fetchAll();

  // 指定したカテゴリー順位ソート
  const sortedBanWords = banWords.sort((a, b) => {
    const indexA = CATEGORY_VALUES.indexOf(a.category);
    const indexB = CATEGORY_VALUES.indexOf(b.category);
    return indexA - indexB;
  });

  return {
    banWords: sortedBanWords,
  };
}
