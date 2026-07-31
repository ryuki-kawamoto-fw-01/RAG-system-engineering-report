import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

type PiiItem = {
  category: string;
  text: string;
};

type PersonalDataDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  piiList: PiiItem[];
  onConfirm: () => void;
};

function PersonalDataDialog({ isOpen, onClose, piiList, onConfirm }: PersonalDataDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black">
        <DialogHeader>
          <DialogTitle>個人情報を検出しました</DialogTitle>
        </DialogHeader>
        <div>
          <p>個人情報をそのまま送信しますか？</p>
          <ul className="mt-6">
            {piiList.map((pii, index) => (
              <li key={index}>{`${pii.category}：${pii.text}`}</li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="tertiary" onClick={onClose} className="w-[120px]">
            キャンセル
          </Button>
          <Button variant="secondary" onClick={onConfirm} className="w-[120px]">
            送信する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PersonalDataDialog;
