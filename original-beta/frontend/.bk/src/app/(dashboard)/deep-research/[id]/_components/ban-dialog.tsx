import { Button } from '../../../../_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../_components/ui/dialog';

interface BanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  banWords: string[];
}

function BanDialog({ isOpen, onClose, banWords }: BanDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black">
        <DialogHeader>
          <DialogTitle>禁止ワード検出</DialogTitle>
          <DialogDescription>
            入力されたメッセージに、管理者によって禁止されている言葉が含まれています。
            <br />
            以下の言葉を含まない内容に修正してください。
            <br />
            <br /> {/* 1行分のスペースを追加 */}
            禁止ワード:{' '}
            {banWords.map((word, index) => (
              <span key={index}>
                「{word}」{index < banWords.length - 1 ? '、' : ''}
              </span>
            ))}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-24 border border-black bg-white text-black hover:bg-gray-200"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BanDialog;
