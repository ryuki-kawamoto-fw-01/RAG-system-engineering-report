import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/app/_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { getExtension } from '@/app/_utils/file';
import { fileSchema } from '../_schemas/file-schema';
import { folderSchema } from '../_schemas/folder-schema';
import { Item } from '../type';

type RenameDialogProps = {
  isOpen: boolean;
  item: Item;
  onRename: (item: Item, newName: string) => Promise<void>;
  onClose: () => void;
};

export default function RenameDialog({ isOpen, item, onRename, onClose }: RenameDialogProps) {
  const renameFileSchema = z.object({
    newName: item.type === 'folder' ? folderSchema : fileSchema,
  });
  type RenameFileFormData = z.infer<typeof renameFileSchema>;

  const form = useForm<RenameFileFormData>({
    resolver: zodResolver(renameFileSchema),
    defaultValues: { newName: item.name },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isSubmitting },
  } = form;

  useEffect(() => {
    reset({ newName: item.name });
  }, [item, reset]);

  const handleRename = async (data: RenameFileFormData) => {
    const newName = data.newName.trim();
    const oldExtension = getExtension(item.name);
    const newExtension = getExtension(newName);

    if (oldExtension !== newExtension) {
      toast.error('ファイルの拡張子を変更することはできません。');
      return;
    }

    try {
      await onRename(item, newName);
      reset();
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message ?? '名前の変更に失敗しました。');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>名前を変更</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleRename)} className="flex flex-col gap-4">
            <div className="text-lg leading-6 text-neutral-900 dark:text-gray-400">
              新しい名前を入力してください
            </div>

            <FormField
              control={control}
              name="newName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="tertiary" className="w-[120px]" onClick={onClose}>
                キャンセル
              </Button>
              <Button
                variant="secondary"
                className="w-[120px]"
                type="submit"
                disabled={!isValid || isSubmitting}
              >
                変更する
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
