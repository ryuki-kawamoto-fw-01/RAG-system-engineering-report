'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import Section from '../_components/error/section';
import SvgCheck from '../_components/icon/decorative/Check';
import SvgPhone from '../_components/icon/decorative/Phone';
import PageLayout from '../_components/layout/page-layout';
import { Button } from '../_components/ui/button';

export default function Error({ error }: { error: Error }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageLayout className="flex items-center justify-center p-0">
      <div className="mt-[52px] flex max-w-[600px] flex-col items-center">
        <div className="flex max-w-[526px] items-center gap-x-2.5">
          {/* トライアル環境なので修正 */}
          {/* <Image src="/images/error-bear.svg" width={140} height={140} alt="謝るくま" /> */}
          <div>
            <div className="text-9xl font-bold leading-[1.3]">500エラー</div>
            <div className="text-sm">申し訳ございません。システムで問題が発生しました。</div>
          </div>
        </div>
        <div className="mt-8 rounded-[20px] bg-white px-[30px] py-5">
          <Section
            title={
              <>
                <SvgCheck className="size-4 text-green-500" />
                <span>以下の原因が考えられます</span>
              </>
            }
            items={['アクセスが一時的に集中している', 'システム側に問題が発生している']}
          />
          <Section
            title={
              <>
                <SvgCheck className="size-4 text-green-500" />
                <span>以下の方法をお試しください</span>
              </>
            }
            items={['少し時間を置いてから再度アクセスしてください']}
            className="mt-4"
          />
          <Section
            title={
              <>
                <SvgPhone className="size-4 text-sky-500" />
                <span>
                  ️問題が解決しない場合は、システム管理者にお問い合わせください。
                  <br />
                  その際、以下の情報をご提供いただけるとスムーズです。
                </span>
              </>
            }
            items={['エラー番号：500', 'アクセスしたURL', 'エラーが発生した日時']}
            className="mt-4"
          />
        </div>
        <Link href="/" className="mt-8">
          <Button variant="secondary" className="w-[200px]">
            ホームへ戻る
          </Button>
        </Link>
      </div>
    </PageLayout>
  );
}
