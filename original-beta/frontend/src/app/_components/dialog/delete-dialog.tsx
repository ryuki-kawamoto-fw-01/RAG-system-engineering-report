import { Button } from '../ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

type DialogButtonProps = {
  title: string;
  description: string | React.ReactNode;
  handleDelete: () => void;
  handleClose: () => void;
};

export default function DeleteDialog({
  title,
  description,
  handleDelete,
  handleClose,
}: DialogButtonProps) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <DialogDescription className="space-y-6 text-lg">{description}</DialogDescription>
      <DialogFooter>
        <Button variant="tertiary" className="w-[120px]" onClick={handleClose}>
          キャンセル
        </Button>
        <Button variant="destructive" className="w-[120px]" onClick={handleDelete}>
          削除する
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
