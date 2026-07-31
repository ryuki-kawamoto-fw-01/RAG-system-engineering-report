import { Button } from '@/app/_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/app/_components/ui/radio-group';
import FileListItems from './file-list-items';

type DuplicateFileDialogProps = {
  isOpen: boolean;
  duplicateFiles: string[];
  duplicateFileAction: string | undefined;
  setDuplicateFileAction: (action: string | undefined) => void;
  onClose: () => void;
  onContinue: (action: 'overwrite' | 'rename') => Promise<void>;
  uploading: boolean;
};

export default function DuplicateFileDialog({
  isOpen,
  duplicateFiles,
  duplicateFileAction,
  setDuplicateFileAction,
  onClose,
  onContinue,
  uploading,
}: DuplicateFileDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="dark:text-black">
            {duplicateFiles.length === 1 ? (
              <p>「{duplicateFiles[0]}」は、すでに存在します。</p>
            ) : (
              <p>同じ名前のファイルが{duplicateFiles.length}件、存在します。</p>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 bg-white">
          <RadioGroup
            value={duplicateFileAction}
            onValueChange={(value: string | undefined) => setDuplicateFileAction(value)}
            className="flex flex-col gap-4"
          >
            {/* ラジオボタン: 置き換える */}
            <label className="flex items-center gap-2">
              <RadioGroupItem
                value="overwrite"
                id="overwrite"
                className="size-5 rounded-full border border-neutral-400"
              />
              <span className="text-[15px] font-normal leading-[22.5px] text-neutral-900">
                置き換える
              </span>
            </label>

            {/* ラジオボタン: 別名で保存する */}
            <label className="flex items-center gap-2">
              <RadioGroupItem
                value="rename"
                id="rename"
                className="size-5 rounded-full border border-neutral-400"
              />
              <span className="text-[15px] font-normal leading-[22.5px] text-neutral-900">
                別名で保存する
              </span>
            </label>
          </RadioGroup>
        </div>
        <FileListItems files={duplicateFiles} />
        <DialogFooter>
          <Button
            className="h-[40px] w-[120px] rounded-[20px] text-white"
            variant="secondary"
            onClick={async () => {
              if (duplicateFileAction === 'overwrite' || duplicateFileAction === 'rename') {
                await onContinue(duplicateFileAction);
              }
            }}
            disabled={!duplicateFileAction || uploading}
          >
            続行する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
