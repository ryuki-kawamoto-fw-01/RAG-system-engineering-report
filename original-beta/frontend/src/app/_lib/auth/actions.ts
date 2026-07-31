'use server';

import { credentialClient, AOAI_SCOPE } from './azure-id';

export async function getAccessToken() {
  try {
    const accessToken = await credentialClient.getToken([AOAI_SCOPE]);

    if (accessToken) {
      return {
        token: accessToken.token,
        // アプリ側でトークンの有効期限を設定
        expiresOnTimestamp: Date.now() + 30 * 60 * 1000, // 30分に設定
      };
    }

    return accessToken;
  } catch (error) {
    console.error('アクセストークン取得中にエラーが発生しました:', error);
    // DEV: 以下の実装は一時的なものです。
    throw new Error('アクセストークン取得時にサーバーでエラーが発生しました');
  }
}
