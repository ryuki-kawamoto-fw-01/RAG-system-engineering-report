import { RTClient, ServerVAD } from 'rt-client';
import type { AccessToken } from 'rt-client';

const SYSTEM_INSTRUCTIONS = `You are a helpful assistant.
Respond in Japanese.
`;
const VAD_CONFIG = {
  type: 'server_vad',
  threshold: 0.5,
  prefix_padding_ms: 300,
  silence_duration_ms: 300,
} as ServerVAD;

// RealTime APIのクライアントを生成する
function rtClient({
  deployment,
  accessToken,
}: {
  deployment?: string;
  accessToken: AccessToken;
}): RTClient {
  // アクセストークンベースの認証設定
  const authConfig = {
    getToken: async () => {
      return accessToken;
    },
  };

  const client = new RTClient(
    new URL(process.env.NEXT_PUBLIC_AOAI_ENDPOINT!),
    // TODO: Danger! デモ用に間に合わせるため認証実装が間に合わなかったが、フロント側でAPIキーを使うのは良くない。そのため、サーバー側で実装orアクセストークンを使用するように修正が必須
    // TODO: 修正後はAPIキーを更新した方が安全
    authConfig,
    { deployment: deployment || process.env.NEXT_PUBLIC_AOAI_MODEL_NAME! }
  );

  client.configure({
    input_audio_transcription: { model: 'whisper-1' },
    turn_detection: VAD_CONFIG,
    modalities: ['text', 'audio'],
    instructions: SYSTEM_INSTRUCTIONS,
  });

  return client;
}

export default rtClient;
