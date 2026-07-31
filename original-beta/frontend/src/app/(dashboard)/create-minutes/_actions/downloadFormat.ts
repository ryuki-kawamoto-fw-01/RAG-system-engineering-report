'use server';

export async function downloadMinutesFormat(resultMinutes: string): Promise<string> {
  try {
    // APIのURLを取得するためのヘルパー関数
    const endpoint = process.env.ORCHESTRATOR_USE_CASE_API_ENDPOINT;
    const credential = process.env.ORCHESTRATOR_USE_CASE_API_CREDENTIAL;

    if (!endpoint || !credential) {
      throw new Error('API設定が見つかりません');
    }

    const apiUrl = `${endpoint}/download-minutes?code=${credential}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resultMinutes,
      }),
    });

    if (!response.ok) {
      throw new Error('フォーマット出力に失敗しました');
    }

    // Blobを取得してbase64に変換して返す
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return base64;
  } catch (error) {
    console.error('Format download error:', error);
    throw new Error('フォーマット出力に失敗しました');
  }
}
