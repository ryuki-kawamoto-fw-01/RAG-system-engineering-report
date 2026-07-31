'use server';

import {
  documentRegisterAzureFunctions,
  standardRegisterAzureFunctions,
} from '../../../../../azure-functions';
import { RenameResponse } from '../type';
import { ALLOW_CONTAINER_NAMES } from './const';

export async function renameFile(
  oldName: string,
  newName: string,
  containerName?: string
): Promise<RenameResponse> {
  // 許可されたcontainerName以外は弾く
  if (containerName && !ALLOW_CONTAINER_NAMES.includes(containerName)) {
    return { success: false, message: '不正なパラメータ指定' };
  }

  // containerNameに応じて適切なAzure Functionsを選択
  const azureFunctions =
    containerName === process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME
      ? standardRegisterAzureFunctions
      : documentRegisterAzureFunctions;

  try {
    const response = await azureFunctions.sendJson<
      { old_name: string; new_name: string; container_name?: string },
      RenameResponse
    >('rename-file', 'POST', {
      old_name: oldName,
      new_name: newName,
      container_name: containerName,
    });
    return response;
  } catch (error) {
    if (error instanceof Error) {
      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        return { success: false, message: errorObj.error_message };
      }
    }
    return { success: false, message: JSON.stringify(error) };
  }
}
