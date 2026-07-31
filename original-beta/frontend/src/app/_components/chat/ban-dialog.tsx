import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

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
          <DialogTitle>禁止ワードを検出しました</DialogTitle>
        </DialogHeader>
        <div>
          <p>内容を修正して、再度送信してください。</p>
          <p className="mt-6">禁止ワード：{banWords.join('、')}</p>
        </div>
        <DialogFooter>
          <Button variant="tertiary" onClick={onClose} className="w-[120px]">
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BanDialog;
