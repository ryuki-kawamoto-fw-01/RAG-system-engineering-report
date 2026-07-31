'use server';
import {
  documentRegisterAzureFunctions,
  standardRegisterAzureFunctions,
} from '../../../../../azure-functions';
import { ALLOW_CONTAINER_NAMES } from './const';

export async function deleteFile(
  fileId: string,
  containerName?: string
): Promise<{ success: boolean; message?: string }> {
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
    await azureFunctions.sendJson<{ id: string; container_name?: string }, { id: string }>(
      'delete-file',
      'POST',
      { id: fileId, container_name: containerName }
    );
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}
