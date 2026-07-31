'use server';

import { dictionaryContainer } from '../../../../../cosmos';
import { CATEGORY_VALUES } from '../_constant';
import { Dictionary } from '../_type';

type Response = {
  dictionaries: Dictionary[];
};

type DBDictionary = Omit<Dictionary, 'terms'> & {
  terms: string[];
};

export async function getDictionaries(): Promise<Response> {
  const { resources: dictionaries } = await dictionaryContainer.items
    .query<DBDictionary>({
      query: 'SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)',
    })
    .fetchAll();

  // 指定したカテゴリー順にソート
  const sortedDictionaries = dictionaries
    .sort((a, b) => {
      const indexA = CATEGORY_VALUES.indexOf(a.category);
      const indexB = CATEGORY_VALUES.indexOf(b.category);
      return indexA - indexB;
    })
    // 用語の文字配列を文字列に変換
    .map((dictionary) =>
      dictionary.terms
        ? { ...dictionary, terms: dictionary.terms.join(',') }
        : { ...dictionary, terms: '' }
    );

  return {
    dictionaries: sortedDictionaries,
  };
}
