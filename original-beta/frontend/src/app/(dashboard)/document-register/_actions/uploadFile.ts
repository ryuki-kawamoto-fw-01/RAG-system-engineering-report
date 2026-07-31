'use server';

import {
  documentRegisterAzureFunctions,
  standardRegisterAzureFunctions,
} from '../../../../../azure-functions';
import { FileUploadResponse } from '../type';
import { ALLOW_CONTAINER_NAMES } from './const';

export async function uploadFile(formData: FormData): Promise<FileUploadResponse> {
  const file = formData.get('file') as File;
  const containerName = formData.get('container_name');
  // 許可されたcontainerName以外は弾く
  if (containerName && !ALLOW_CONTAINER_NAMES.includes(containerName as string)) {
    return { success: false, filename: file.name, message: '不正なパラメータ指定' };
  }

  // containerNameに応じて適切なAzure Functionsを選択
  const azureFunctions =
    containerName === process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME
      ? standardRegisterAzureFunctions
      : documentRegisterAzureFunctions;

  try {
    if (file && file.size > 0) {
      const data = await azureFunctions.sendForm<FileUploadResponse>('create-file', formData);
      return data;
    }
  } catch (err) {
    if (err instanceof Error) {
      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = err.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        return {
          success: false,
          filename: file.name,
          message: errorObj.error_message,
        };
      }
    }
    return { success: false, filename: file.name, message: JSON.stringify(err) };
  }
  return { success: false, filename: file.name, message: '' };
}
