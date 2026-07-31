'use server';

import { imageGenerationDB } from '@/app/_db/image';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { imageGenerationContainer } from '../../../../../cosmos';

type ImageResponse = {
  answerUrl: string;
  answerBase64: string;
  blobName?: string; // blob_name を追加
  log?: LLMserviceBackEndLog<'image'> | null;
};

type ImageErrorResponse = {
  error: string;
};

export async function imageGeneration(
  id: string,
  imageContent: string,
  imageSize: string,
  imageFormat: string
): Promise<ImageResponse | ImageErrorResponse> {
  const user = await getCurrentUser();
  try {
    const apiBaseUrl = process.env.ORCHESTRATOR_USE_CASE_API_ENDPOINT;

    // 送信データ
    const requestBody = {
      imageContent,
      imageSize,
      imageFormat,
    };

    // AbortControllerでタイムアウトを設定（2分）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const res = await fetch(`${apiBaseUrl}/image-generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-functions-key': process.env.ORCHESTRATOR_USE_CASE_API_CREDENTIAL || '',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      try {
        // エラーレスポンスがJSONの場合
        const errorText = await res.text();
        console.error('API Error Response:', errorText);

        // JSONエラーメッセージをパース
        try {
          const errorObj = JSON.parse(errorText);
          return {
            error:
              errorObj.error ||
              errorObj.error_message ||
              `画像生成APIエラー (${res.status}: ${res.statusText})`,
          };
        } catch {
          // JSONでない場合はテキストをそのまま使用
          return {
            error:
              errorText || `画像生成APIの呼び出しに失敗しました (${res.status}: ${res.statusText})`,
          };
        }
      } catch {
        return { error: `画像生成APIの呼び出しに失敗しました (${res.status}: ${res.statusText})` };
      }
    }

    // 新しいバックエンドのJSONレスポンスを処理
    const jsonResponse = await res.json();

    if (!jsonResponse.success || !jsonResponse.image_url) {
      return { error: jsonResponse.error || '画像生成に失敗しました' };
    }

    // Cosmos DBにはBlobストレージのURLのみを保存（base64は保存しない - 2MB制限のため）
    try {
      await imageGenerationDB(imageGenerationContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        imageContent,
        imageSize,
        imageFormat,
        outputForm: jsonResponse.image_url, // BlobストレージのURLを保存（base64ではない）
        blobName: jsonResponse.blob_name || undefined,
        log: jsonResponse.log || undefined,
      });
    } catch (dbError) {
      throw new Error(
        `Database save failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`
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
    console.error('Image generation error:', error);

    // タイムアウトエラーの処理
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: '画像生成がタイムアウトしました。もう一度お試しください。' };
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
          return { error: errorObj.error_message || getMessage('E_F_00110', '作成結果') };
        }
      } catch {
        // JSONパース失敗時は汎用メッセージ
        // noop
      }

      // 具体的なエラーメッセージがある場合は表示
      return { error: `エラーが発生しました: ${error.message}` };
    }
    return { error: getMessage('E_F_00110', '作成結果') };
  }
}
