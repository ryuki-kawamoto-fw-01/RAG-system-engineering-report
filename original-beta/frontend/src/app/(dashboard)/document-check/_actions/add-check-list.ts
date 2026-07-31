'use server';

import { CheckCad } from '../../../_types/check-candidate';

export async function addCheckLists(data: CheckCad[], idList: string[]): Promise<CheckCad[]> {
  const checkCadList: CheckCad[] = [];

  // チェックされたスペック精読結果をCSV出力
  for (let i = 0; i < idList.length; i++) {
    const result = data.find((val) => val.id === idList[i]);

    if (result === undefined) {
      console.error('item does not exist');
      // 何らかのエラー処理
      return checkCadList;
    }
    checkCadList.push(result);
  }

  return checkCadList;
}
