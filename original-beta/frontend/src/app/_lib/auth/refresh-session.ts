export async function refreshAuthSession(signal?: AbortSignal) {
  try {
    const response = await fetch('/.auth/refresh', {
      method: 'GET',
      credentials: 'include',
      signal,
    });

    if (!response.ok) {
      console.error('[AUTH_REFRESH] リフレッシュ失敗:', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }

    // レスポンスボディを消費して接続を適切にクローズ
    await response.text();

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('[AUTH_REFRESH] リフレッシュエラー:', error);
    }
    return { success: false, error: String(error) };
  }
}
