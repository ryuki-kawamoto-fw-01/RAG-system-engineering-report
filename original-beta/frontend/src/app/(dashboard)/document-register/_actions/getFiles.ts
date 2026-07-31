'use server';

import {
  documentRegisterAzureFunctions,
  standardRegisterAzureFunctions,
} from '../../../../../azure-functions';
import { Folder, GetFilesResponse } from '../type';
import { ALLOW_CONTAINER_NAMES } from './const';

export async function getFiles(
  prefix: string = '',
  containerName?: string
): Promise<GetFilesResponse> {
  // 許可されたcontainerName以外は弾く
  if (containerName && !ALLOW_CONTAINER_NAMES.includes(containerName)) {
    console.error(`不正なコンテナへのリクエスト${containerName}`);
    return { success: false, message: '不正なパラメータ指定' };
  }

  // containerNameに応じて適切なAzure Functionsを選択
  const azureFunctions =
    containerName === process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME
      ? standardRegisterAzureFunctions
      : documentRegisterAzureFunctions;

  try {
    const files = await azureFunctions.sendJson<
      { prefix: string; container_name?: string },
      Folder[]
    >('get-files', 'POST', {
      prefix,
      container_name: containerName,
    });
    return { success: true, files };
  } catch (err) {
    console.error('GET files error:', JSON.stringify(err));
    if (err instanceof Error) {
      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = err.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        return { success: false, message: errorObj.error_message };
      }
    }
    return { success: false, message: JSON.stringify(err) };
  }
}
