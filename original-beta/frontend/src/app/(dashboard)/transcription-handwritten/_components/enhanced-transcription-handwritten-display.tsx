import SvgCopy from '@/app/_components/icon/button/Copy';
import { Button } from '@/app/_components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { cn } from '@/app/_utils/tw-merge';
import { Textarea } from '../../../_components/ui/textarea';

type Props = {
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  result: string;
  handleCopy: () => void;
  className?: string;
  isSubmitting: boolean;
};

export default function EnhancedTranscriptionHandwrittenDisplay({
  isEditing,
  onChange,
  result,
  handleCopy,
  className,
  isSubmitting,
}: Props): JSX.Element {
  return (
    <div className={cn('grow relative', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="icon"
              size="icon"
              onClick={handleCopy}
              className="absolute right-1 top-1 z-10"
            >
              <SvgCopy className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>コピー</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Textarea
        value={result}
        onChange={onChange}
        className="h-full"
        readOnly={!isEditing}
        placeholder={
          isSubmitting ? '文字起こしを作成中...' : 'ここに文字起こしした結果が表示されます'
        }
      />
    </div>
  );
}
