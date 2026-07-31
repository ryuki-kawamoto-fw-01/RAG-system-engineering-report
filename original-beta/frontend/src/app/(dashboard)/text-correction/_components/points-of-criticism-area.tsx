import { Textarea } from '@/app/_components/ui/textarea';
import { Label } from '../../../_components/ui/label';

type Props = {
  pointsOfCriticism: string;
};

export default function PointsOfCriticismArea({ pointsOfCriticism }: Props): JSX.Element {
  return (
    <div className="flex flex-col">
      <div className="flex min-h-8 items-end justify-between">
        <Label className="text-base">指摘事項</Label>
      </div>
      <Textarea
        value={pointsOfCriticism}
        placeholder="ここに生成された指摘事項が表示されます"
        readOnly
        className="mt-1 min-h-[100px]"
      />
    </div>
  );
}
