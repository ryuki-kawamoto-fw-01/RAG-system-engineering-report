import SvgClose from '@/app/_components/icon/button/Close';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import { Button } from '@/app/_components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';

const handleDownload = (report: string, filename: string) => {
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

type Props = {
  isEditing: boolean;
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => void;
  report: string;
  filename: string;
};

export default function ActionButtons({
  isEditing,
  handleEdit,
  handleCancel,
  handleSave,
  report,
  filename,
}: Props) {
  return (
    <>
      {!isEditing ? (
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="icon"
                  size="icon"
                  onClick={() => handleDownload(report, filename)}
                >
                  <SvgDownload className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>結果をダウンロード</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="icon" size="icon" onClick={handleEdit}>
                  <SvgEdit className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>編集</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        <div className="flex items-center gap-x-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="tertiary" size="sm" onClick={handleCancel}>
                  <SvgClose className="size-4" />
                  キャンセル
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>編集前に戻す</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="secondary" size="sm" onClick={handleSave}>
                  <SvgSave className="size-4" />
                  保存
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>編集内容を保存</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </>
  );
}
