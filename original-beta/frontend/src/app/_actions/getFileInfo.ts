'use server';

import { GetFileUrlResponse } from '../(dashboard)/document-register/type';
import {
  documentRegisterAzureFunctions,
  standardRegisterAzureFunctions,
} from '../../../azure-functions';

async function fetchFileUrl(
  azureFunction: {
    sendJson: (endpoint: string, method: string, data: object) => Promise<GetFileUrlResponse>;
  },
  filepath: string,
  is_split_file: boolean,
  containerName?: string
): Promise<GetFileUrlResponse | undefined> {
  try {
    if (!filepath) {
      console.error('filepathが指定されてません');
      return;
    }
    const response = await azureFunction.sendJson('get-file-url', 'POST', {
      filepath,
      is_split_file,
      containerName,
    });
    if (response.success) {
      return response;
    }
    console.error('Error getting file:', response);
    return;
  } catch (error) {
    console.error('Error handling POST request:', error);
    return;
  }
}

export async function getFileUrl(
  filepath: string,
  is_split_file: boolean = false,
  containerName?: string
): Promise<GetFileUrlResponse | undefined> {
  return fetchFileUrl(documentRegisterAzureFunctions, filepath, is_split_file, containerName);
}

export async function getFileUrlStd(
  filepath: string,
  is_split_file: boolean = false
): Promise<GetFileUrlResponse | undefined> {
  return fetchFileUrl(standardRegisterAzureFunctions, filepath, is_split_file);
}
