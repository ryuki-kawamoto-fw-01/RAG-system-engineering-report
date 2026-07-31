import { setGlobalDispatcher, EnvHttpProxyAgent } from 'undici';
import { isDevelopment } from '../../../config';

// グローバルにプロキシエージェントを設定
export function setProxyAgent() {
  if (isDevelopment && process.env.PROXY_URL) {
    const envHttpProxyAgent = new EnvHttpProxyAgent({
      httpProxy: process.env.PROXY_URL,
      httpsProxy: process.env.PROXY_URL,
      noProxy: 'localhost,127.0.0.1',
    });
    setGlobalDispatcher(envHttpProxyAgent);
  }
}
