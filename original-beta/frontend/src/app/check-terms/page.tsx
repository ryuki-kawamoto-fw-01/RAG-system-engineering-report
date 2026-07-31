'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PageLayout from '../_components/layout/page-layout';
import { Button } from '../_components/ui/button';
import { Checkbox } from '../_components/ui/checkbox';
import TermsArea from './_components/terms-area';

function CheckTerms() {
  const [Checkboxflag, Setflag] = useState(false);
  const handleCheckboxChange = () => {
    Setflag(!Checkboxflag);
  };
  const router = useRouter();
  const handleClick = () => {
    router.push('/#');
  };

  return (
    <PageLayout className="overflow-hidden px-6 py-5">
      {/* トライアル環境なので修正 */}
      <div className="text-sm font-bold leading-[1.2rem] text-neutral-900">
        製造業向け
        <br />
        アシスタントAI
      </div>
      {/* <Image src="/images/icons/header/logo_horizontal_all.svg" width={103} height={32} alt={title} /> */}
      <div className="flex h-screen flex-col items-center">
        <div className="mb-4 text-5xl font-semibold">
          <h1>利用規約</h1>
        </div>
        <TermsArea />
        <div className="mb-4 flex items-center">
          <Checkbox id="terms" checked={Checkboxflag} onCheckedChange={handleCheckboxChange} />
          <label
            htmlFor="terms"
            className="px-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            利用規約に同意する
          </label>
        </div>
        <Button
          className="w-[300px] px-5 py-2 text-white"
          variant="secondary"
          onClick={handleClick}
          disabled={!Checkboxflag}
        >
          利用開始する
        </Button>
      </div>
    </PageLayout>
  );
}
export default CheckTerms;
