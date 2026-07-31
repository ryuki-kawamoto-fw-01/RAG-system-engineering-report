'use server';
import {
  documentRegisterAzureFunctions,
  standardRegisterAzureFunctions,
} from '../../../../../azure-functions';
import { ALLOW_CONTAINER_NAMES } from './const';

export async function rmTree(
  prefix: string,
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
    azureFunctions.sendJson<{ prefix: string; container_name?: string }, { ids: string[] }>(
      'rmtree',
      'POST',
      { prefix, container_name: containerName }
    );
    return { success: true };
  } catch (err) {
    console.error(err);
  }
  return { success: false };
}
