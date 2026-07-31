import { AccessToken, type ServerVAD } from 'rt-client';
import { create } from 'zustand';
import { getAccessToken } from './auth/actions';

/**
 * アプリケーション全体の設定を管理するストア
 */
export type configStore = {
  // VAD（Voice Activity Detection）の設定
  vadConfig: ServerVAD;

  // 現在のチャットID
  currentThreadId?: string;

  // クライアント設定（API接続情報）
  clientConfig: {
    accessToken?: AccessToken;
    endpoint: string;
    modelName: string;
  };

  /**
   * セッションを設定し、必要に応じてアクセストークンを更新
   * @param threadId 現在のチャットID
   * @returns アクセストークン、またはエラー時にundefined
   */
  setSession: (threadId: string) => Promise<AccessToken | undefined>;

  /**
   * セッションの有効期限切れフラグを設定
   * @param isExpired 有効期限切れフラグ
   */
  setSessionExpired: (isExpired: boolean) => void;

  /**
   * アクセストークンを設定
   * @param accessToken アクセストークン
   */
  setAccessToken: (accessToken: AccessToken) => void;

  /**
   * VAD設定を更新
   * @param config 新しいVAD設定
   */
  setVadConfig: (config: ServerVAD) => void;

  /**
   * 現在のクライアント設定を取得
   * @returns クライアント設定オブジェクト
   */
  getClientConfig: () => {
    accessToken?: AccessToken;
    endpoint: string;
    modelName: string;
  };

  /**
   * アクセストークンの有効期限タイムスタンプを取得
   * @returns 有効期限のUNIXタイムスタンプ、またはundefined
   */
  getExpireTimeStamp: () => number | undefined;

  /**
   * セッションが有効期限切れかどうかを示すフラグ
   */
  isSessionExpired: boolean;
};

export const useConfigStore = create<configStore>()((set, get) => {
  return {
    vadConfig: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 300,
    } as ServerVAD,

    clientConfig: {
      accessToken: undefined,
      endpoint: process.env.NEXT_PUBLIC_AOAI_ENDPOINT!,
      modelName: process.env.NEXT_PUBLIC_AOAI_MODEL_NAME!,
    },

    isSessionExpired: true,

    getExpireTimeStamp: () => {
      try {
        const accessToken = get().clientConfig.accessToken;
        return accessToken?.expiresOnTimestamp;
      } catch (error) {
        console.error('有効期限タイムスタンプの取得に失敗しました:', error);
        return undefined;
      }
    },

    setSession: async (threadId: string): Promise<AccessToken | undefined> => {
      // 現在のアクセストークンの状態をチェック
      const isSameChat =
        threadId !== get().currentThreadId
          ? (set(() => ({ currentThreadId: threadId })), false)
          : true;
      const oldAccessToken = isSameChat ? get().clientConfig.accessToken : undefined;

      // アクセストークンが存在しないか有効期限切れの場合、新しいトークンを取得
      const needNewToken = !oldAccessToken || oldAccessToken.expiresOnTimestamp < Date.now();

      if (needNewToken) {
        try {
          const accessToken = await getAccessToken();

          // 新しいアクセストークンをストアに設定
          if (accessToken) {
            set(() => ({
              clientConfig: {
                ...get().clientConfig,
                accessToken,
              },
            }));
          }

          return accessToken;
        } catch (error) {
          console.error('アクセストークンの取得に失敗しました:', error);
          return undefined;
        }
      }

      return get().clientConfig.accessToken;
    },

    setSessionExpired: (isExpired: boolean) => {
      set(() => ({
        isSessionExpired: isExpired,
      }));
    },

    setAccessToken: (accessToken: AccessToken) =>
      set(() => ({
        clientConfig: {
          ...get().clientConfig,
          accessToken,
        },
      })),

    setVadConfig: (config: ServerVAD) =>
      set(() => ({
        vadConfig: config,
      })),

    getClientConfig: () => {
      return {
        accessToken: get().clientConfig.accessToken,
        endpoint: get().clientConfig.endpoint,
        modelName: get().clientConfig.modelName,
      };
    },
  };
});
