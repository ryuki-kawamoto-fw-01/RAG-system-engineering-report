'use server';

import { chatFileManageAzureFunctions } from '../../../azure-functions';
import { ErrorResponse } from './types';

type FileUploadResponse =
  | {
      success: true;
      filename: string;
      url: string;
    }
  | (ErrorResponse & {
      filename: string;
    });

export async function uploadFile(formData: FormData): Promise<FileUploadResponse> {
  const file = formData.get('file') as File;
  try {
    if (file && file.size > 0) {
      const data = await chatFileManageAzureFunctions.sendForm<FileUploadResponse>(
        'upload-file',
        formData
      );
      return data;
    }
  } catch (err) {
    console.error('Error uploading file:', err);
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
