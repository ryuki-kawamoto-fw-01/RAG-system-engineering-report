'use server';

import { updateImageDB } from '@/app/_db/image';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { imageGenerationContainer } from '../../../../../cosmos';

type FixImageResponse = {
  answerUrl: string; // SAS付きURL
  answerBase64: string; // base64データURL
  blobName?: string; // blob_name を追加
  log?: LLMserviceBackEndLog<'image'> | null;
};

type FixImageErrorResponse = {
  error: string;
};

export async function fixImage(
  blobName: string, // base64の代わりにblobNameを受け取る
  fixImageRequest: string,
  id: string,
  imageSize: string,
  imageFormat: string
): Promise<FixImageResponse | FixImageErrorResponse> {
  try {
    const apiBaseUrl = process.env.ORCHESTRATOR_USE_CASE_API_ENDPOINT;

    // AbortControllerでタイムアウトを設定（2分）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const res = await fetch(`${apiBaseUrl}/fix-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-functions-key': process.env.ORCHESTRATOR_USE_CASE_API_CREDENTIAL || '',
      },
      body: JSON.stringify({
        blobName, // blobNameを送信
        fixImageRequest,
        imageSize,
        imageFormat,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      try {
        // エラーレスポンスがJSONの場合
        const errorText = await res.text();
        console.error('Fix Image API Error Response:', errorText);

        // JSONエラーメッセージをパース
        try {
          const errorObj = JSON.parse(errorText);
          return {
            error:
              errorObj.error ||
              errorObj.error_message ||
              `画像修正APIエラー (${res.status}: ${res.statusText})`,
          };
        } catch {
          // JSONでない場合はテキストをそのまま使用
          return {
            error:
              errorText || `画像修正APIの呼び出しに失敗しました (${res.status}: ${res.statusText})`,
          };
        }
      } catch {
        return { error: `画像修正APIの呼び出しに失敗しました (${res.status}: ${res.statusText})` };
      }
    }

    // 新しいバックエンドのJSONレスポンスを処理
    const jsonResponse = await res.json();

    if (!jsonResponse.success || !jsonResponse.image_url) {
      return { error: jsonResponse.error || '画像修正に失敗しました' };
    }

    // Cosmos DBにはBlobストレージのURLのみを保存（base64は保存しない - 2MB制限のため）
    try {
      await updateImageDB(imageGenerationContainer, {
        id,
        createdAt: new Date(),
        fixImageRequest,
        outputForm: jsonResponse.image_url, // BlobストレージのURLを保存（base64ではない）
        blobName: jsonResponse.blob_name || undefined,
        log: jsonResponse.log || undefined,
      });
    } catch (dbError) {
      throw new Error(
        `Database update failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`
      );
    }

    // SAS付きURLから画像をダウンロードしてbase64に変換（表示用）
    const imageRes = await fetch(jsonResponse.image_url);
    if (!imageRes.ok) {
      // 画像のダウンロードに失敗してもURLは返す
      console.warn('SAS URL から画像のダウンロードに失敗しました');
      return {
        answerUrl: jsonResponse.image_url,
        answerBase64: jsonResponse.image_url,
        blobName: jsonResponse.blob_name,
        log: jsonResponse.log || null,
      };
    }

    const buffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:image/${imageFormat};base64,${base64}`;

    return {
      answerUrl: jsonResponse.image_url, // BlobストレージのURLを返す
      answerBase64: dataUrl, // 表示用にbase64も返す
      blobName: jsonResponse.blob_name,
      log: jsonResponse.log || null,
    };
  } catch (error) {
    console.error('Fix image error:', error);

    // タイムアウトエラーの処理
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: '画像修正がタイムアウトしました。もう一度お試しください。' };
    }

    // 接続エラーの処理
    if (
      error instanceof Error &&
      (error.message.includes('TIMEOUT') ||
        error.message.includes('timeout') ||
        error.message.includes('CONNECT_TIMEOUT'))
    ) {
      return {
        error: 'サーバーへの接続がタイムアウトしました。ネットワーク接続を確認してください。',
      };
    }

    if (error instanceof Error) {
      try {
        const jsonRegex = /\{[\s\S]*\}/;
        const jsonMatch = error.message.match(jsonRegex);

        if (jsonMatch) {
          const errorObj = JSON.parse(jsonMatch[0]);
          return { error: errorObj.error_message };
        }
      } catch {
        // noop: エラー詳細は不要
      }

      // 具体的なエラーメッセージがある場合は表示
      return { error: `エラーが発生しました: ${error.message}` };
    }
    return { error: '画像の修正中にエラーが発生しました' };
  }
}
