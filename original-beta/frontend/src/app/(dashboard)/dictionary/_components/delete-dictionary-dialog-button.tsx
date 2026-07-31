import { useState } from 'react';

import DeleteDialog from '@/app/_components/dialog/delete-dialog';
import SvgDelete from '@/app/_components/icon/button/Delete';
import { Button } from '@/app/_components/ui/button';
import { Dialog, DialogTrigger } from '@/app/_components/ui/dialog';

interface DeleteDictionaryDialogButtonProps {
  handleDeleteDictionary: () => void;
  disabled: boolean;
}

export default function DeleteDictionaryDialogButton({
  handleDeleteDictionary,
  disabled,
}: DeleteDictionaryDialogButtonProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    setDeleteDialogOpen(isOpen);
  };

  const handleDelete = () => {
    handleDeleteDictionary();
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
          削除
        </Button>
      </DialogTrigger>
      <DeleteDialog
        title="選択した項目を削除しますか？"
        description="この操作は取り消せません。"
        handleDelete={handleDelete}
        handleClose={handleClose}
      />
    </Dialog>
  );
}
