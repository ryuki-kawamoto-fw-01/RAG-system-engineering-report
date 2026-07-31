import { useState } from 'react';
import DeleteDialog from '@/app/_components/dialog/delete-dialog';
import SvgDelete from '@/app/_components/icon/button/Delete';
import { Button } from '@/app/_components/ui/button';
import { Dialog, DialogTrigger } from '@/app/_components/ui/dialog';

interface DeleteTemplateDialogButtonProps {
  handleDeleteQa: () => void;
  disabled: boolean;
}

export default function DeleteTemplateDialogButton({
  handleDeleteQa,
  disabled,
}: DeleteTemplateDialogButtonProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    setDeleteDialogOpen(isOpen);
  };

  const handleDelete = () => {
    handleDeleteQa();
    setDeleteDialogOpen(false);
  };

  const handleClose = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <Dialog open={isDeleteDialogOpen} onOpenChange={!disabled ? handleOpen : undefined}>
      <DialogTrigger asChild>
        <Button
          variant="tertiary"
          size="sm"
          disabled={disabled}
          onClick={() => setDeleteDialogOpen(true)}
        >
          <SvgDelete className="size-4" />
          <span>削除</span>
        </Button>
      </DialogTrigger>
      <DeleteDialog
        title="プロンプトを削除しますか？"
        description={
          <>
            <p>選択されたプロンプトが完全に消去されます。復元することはできません。</p>
            <p>本当に削除しますか？</p>
          </>
        }
        handleDelete={handleDelete}
        handleClose={handleClose}
      />
    </Dialog>
  );
}
