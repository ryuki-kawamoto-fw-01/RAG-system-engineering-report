'use server';

import {
  documentRegisterAzureFunctions,
  standardRegisterAzureFunctions,
} from '../../../../../azure-functions';
import { FolderUploadResponse } from '../type';

import { ALLOW_CONTAINER_NAMES } from './const';

export async function createFolder(
  folder: string,
  containerName?: string
): Promise<FolderUploadResponse> {
  // 許可されたcontainerName以外は弾く
  if (containerName && !ALLOW_CONTAINER_NAMES.includes(containerName)) {
    return { success: false, folder, message: '不正なパラメータ指定' };
  }

  // containerNameに応じて適切なAzure Functionsを選択
  const azureFunctions =
    containerName === process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME
      ? standardRegisterAzureFunctions
      : documentRegisterAzureFunctions;

  try {
    await azureFunctions.sendJson<
      { folder: string; container_name?: string },
      FolderUploadResponse
    >('create-folder', 'POST', { folder, container_name: containerName });
    return { success: true, folder };
  } catch (err) {
    if (err instanceof Error) {
      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = err.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        return { success: false, folder, message: errorObj.error_message };
      }
    }
    return { success: false, folder, message: JSON.stringify(err) };
  }
}
