'use server';

import {
  documentRegisterAzureFunctions,
  standardRegisterAzureFunctions,
} from '../../../../../azure-functions';
import { DownloadFolderRequest, DownloadFolderResponse } from '../type';
import { ALLOW_CONTAINER_NAMES } from './const';

export async function downloadFolder(
  prefix: string,
  containerName?: string
): Promise<DownloadFolderResponse> {
  // 許可されたcontainerName以外は弾く
  if (containerName && !ALLOW_CONTAINER_NAMES.includes(containerName)) {
    return { success: false, message: '不正なパラメータ指定', statusCode: 400 };
  }

  // containerNameに応じて適切なAzure Functionsを選択
  const azureFunctions =
    containerName === process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME
      ? standardRegisterAzureFunctions
      : documentRegisterAzureFunctions;

  return await azureFunctions.sendJson<DownloadFolderRequest, DownloadFolderResponse>(
    'download-folder',
    'POST',
    { prefix, container_name: containerName }
  );
}
