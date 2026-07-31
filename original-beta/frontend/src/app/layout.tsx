import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import { headers } from 'next/headers';
import { description, title } from '../../config';
//import { ThemeProvider } from './_components/ui/theme-provider';
import { setProxyAgent } from './_utils/proxy';
import { cn } from './_utils/tw-merge';
import './globals.css';
import ogpImage from './opengraph-image.png';
import StoreProvider from './StoreProvider';

// グローバルにプロキシエージェントを設定（一時的にコメントアウト）
setProxyAgent();

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [ogpImage.src],
    locale: 'ja_JP',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  headers();

  return (
    <html lang="ja">
      <body className={cn(notoSansJp.className, 'text-neutral-900 h-screen w-screen')}>
        <StoreProvider>
          {/* TODO: ダークモード実装時に元に戻す */}
          {/* <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          > */}
          {children}
          {/* </ThemeProvider> */}
        </StoreProvider>
      </body>
    </html>
  );
}
