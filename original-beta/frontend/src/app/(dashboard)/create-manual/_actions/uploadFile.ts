'use server';

import { manualAzureFunctions } from '../../../../../azure-functions';

export async function uploadFile(formData: FormData) {
  try {
    const result = await manualAzureFunctions.sendForm<{
      filename: string;
      url: string;
      success: boolean;
    }>('upload-file', formData);

    return {
      success: true,
      fileName: result.filename,
      url: result.url,
    };
  } catch (error) {
    // キャッチされたエラーを処理
    console.error('Error upload file:', error);

    // const errorMessage = getMessage('E_F_00110', '作成結果');

    return {
      message: error,
      success: false,
    };
  }
}

/**
 * SAS URL取得（アップロード前に呼び出す）
 *
 * Azure Functions経由でSAS URLを生成
 *
 * @param filename - アップロードするファイル名
 * @returns SAS URL（uploadUrl）とBlob URL（blobUrl）
 */
export async function getSasUrl(filename: string) {
  try {
    const result = await manualAzureFunctions.sendJson<
      { filename: string },
      {
        filename: string;
        uploadUrl: string;
        blobUrl: string;
        success: boolean;
      }
    >('generate-upload-sas', 'POST', { filename });

    return {
      success: true,
      uploadUrl: result.uploadUrl,
      blobUrl: result.blobUrl,
    };
  } catch (error) {
    console.error('Error generating SAS:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * SAS URLを使用してサーバーサイドでBlobにアップロードする
 *
 * 本番環境ではクライアントからAzure Blob Storageへ直接アクセスできないため、
 * サーバー経由でアップロードを行う
 *
 * @param formData - file（Fileオブジェクト）、uploadUrl（SAS URL）、contentType（MIMEタイプ）を含む
 * @returns アップロード結果
 */
export async function uploadWithSasUrl(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const uploadUrl = formData.get('uploadUrl') as string;

    if (!file) {
      return {
        success: false,
        error: 'ファイルが指定されていません',
      };
    }

    if (!uploadUrl) {
      return {
        success: false,
        error: 'アップロードURLが指定されていません',
      };
    }

    // サーバーサイドでBlobにアップロード
    const arrayBuffer = await file.arrayBuffer();
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: arrayBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', uploadResponse.status, errorText);
      return {
        success: false,
        error: `アップロード失敗: ${uploadResponse.status}`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error uploading file to blob:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}
