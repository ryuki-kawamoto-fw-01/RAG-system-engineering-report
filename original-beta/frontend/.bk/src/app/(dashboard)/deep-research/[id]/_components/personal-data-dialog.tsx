import { Button } from '../../../../_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../_components/ui/dialog';

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
          <DialogTitle>個人情報が検出されました</DialogTitle>
          <DialogDescription>
            以下の個人情報が検出されました。送信を続行しますか？
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <ul>
            {piiList.map((pii, index) => (
              <li key={index}>{`${pii.category}: ${pii.text}`}</li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-24 border border-black bg-white text-black hover:bg-gray-200"
          >
            戻る
          </Button>
          <Button
            onClick={onConfirm}
            className="w-24 border border-black bg-black text-white hover:bg-gray-800"
          >
            送信
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PersonalDataDialog;
