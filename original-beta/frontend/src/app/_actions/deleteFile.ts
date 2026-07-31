'use server';

import { chatFileManageAzureFunctions } from '../../../azure-functions';
import { ErrorResponse } from './types';

type FileDeleteResponse =
  | {
      success: true;
      filename: string;
    }
  | (ErrorResponse & {
      filename: string;
    });

export async function deleteFile(
  filename: string,
  containerName?: string
): Promise<FileDeleteResponse> {
  try {
    const response = await chatFileManageAzureFunctions.sendJson<
      { filename: string; containerName?: string },
      FileDeleteResponse
    >('delete-file', 'POST', { filename, containerName });
    return response;
  } catch (err) {
    console.error('Error deleting file:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      filename,
      message: errorMessage,
    };
  }
}
