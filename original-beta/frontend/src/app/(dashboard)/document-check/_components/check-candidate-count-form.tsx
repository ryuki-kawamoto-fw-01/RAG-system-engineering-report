import { Dispatch, SetStateAction } from 'react';
import { Slider } from '@/app/_components/ui/slider';
import { Label } from '../../../_components/ui/label';

type CheckCandidateCountFormProps = {
  checkCandidateCount: number;
  setCheckCandidateCount: Dispatch<SetStateAction<number>>;
};

export default function CheckCandidateCountForm({
  checkCandidateCount,
  setCheckCandidateCount,
}: CheckCandidateCountFormProps) {
  const handleIdeationCountChange = (value: number[]) => {
    setCheckCandidateCount(value[0]);
  };

  return (
    <div className="mt-2 space-y-4 p-1">
      <div className="flex items-center">
        <Label className="text-base">
          チェック候補の出力件数
          {/* <span className="ml-2 text-red-500">※必須</span> */}
        </Label>
        <span className="ml-4 text-base">{checkCandidateCount} 件</span>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[checkCandidateCount]}
        onValueChange={handleIdeationCountChange}
        className="w-[30%]"
      />
    </div>
  );
}
