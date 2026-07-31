'use server';

import { ManualStep } from '@/app/_store/slice/manual';
import { manualAzureFunctions } from '../../../../../azure-functions';

export interface SaveManualRequest {
  manualId: string;
  steps: ManualStep[];
  frameUrls: string[];
  containerName?: string;
  folderPath?: string;
  blobFolderName?: string;
  llmOutputUrl?: string;
  // ファイルURL情報
  wordFileURL?: string;
  markdownFileURL?: string;
  excelFileURL?: string;
}

export interface SaveManualResponse {
  success: boolean;
  message?: string;
  // 更新されたファイルURL
  updatedFiles?: {
    wordFileURL?: string;
    markdownFileURL?: string;
    excelFileURL?: string;
  };
}

export async function saveManual(request: SaveManualRequest): Promise<SaveManualResponse> {
  try {
    // バックエンドのマニュアル保存APIを呼び出し
    const response = await manualAzureFunctions.sendJson<SaveManualRequest, SaveManualResponse>(
      'save-manual',
      'POST',
      request
    );

    return response;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'マニュアルの保存に失敗しました');
  }
}
