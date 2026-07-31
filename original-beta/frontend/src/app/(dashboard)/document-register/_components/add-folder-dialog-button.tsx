import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/app/_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/_components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { formatFileSize } from '@/app/_utils/format-file-size';
import { getMessage } from '@/app/_utils/message';
import { createFolder } from '../_actions/createFolder';
import { AddFolderFormData, addFolderSchema } from '../_schemas/add-folder-schema';
import { Item } from '../type';

export type AddFolderDialogButtonProps = {
  selectedIndexId: string | null;
  currentPath: string[];
  currentItems: Item[];
  appendItemToSelectedIndex: (item: Item) => void;
  containerName?: string;
};

export default function AddFolderDialogButton({
  selectedIndexId,
  currentPath,
  currentItems,
  appendItemToSelectedIndex,
  containerName,
}: AddFolderDialogButtonProps) {
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  function sameFolder(name: string) {
    return currentItems.some((item) => item.name === name);
  }

  const form = useForm<AddFolderFormData>({
    resolver: zodResolver(addFolderSchema),
    defaultValues: {
      newName: '',
    },
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isValid },
  } = form;

  async function handleAddFolder(data: AddFolderFormData) {
    try {
      const newItemName = data.newName.trim();

      if (sameFolder(newItemName)) {
        toast.error(getMessage('E_F_00305', 'フォルダ'));
        return;
      }

      if (selectedIndexId) {
        const blobName =
          currentPath.length > 0
            ? `${selectedIndexId}/${currentPath.join('/')}/${newItemName}`
            : `${selectedIndexId}/${newItemName}`;
        const result = await createFolder(blobName, containerName);
        if (!result.success) {
          toast.error(result.message ?? getMessage('E_F_00330', 'フォルダ'));
          return;
        }
        appendItemToSelectedIndex({
          id: blobName,
          name: newItemName,
          size: formatFileSize({ bytes: 0 }),
          modified: new Date().toISOString(),
          type: 'folder',
        });
      }

      toast.success(getMessage('I_F_00100', 'フォルダ'));
      setIsAddingFolder(false);
      reset();
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error((error as Error).message ?? getMessage('E_F_00330', 'フォルダ'));
    }
  }

  return (
    <Dialog open={isAddingFolder} onOpenChange={setIsAddingFolder}>
      <DialogTrigger asChild>
        <Button variant="tertiary" size="sm" disabled={!selectedIndexId}>
          <PlusIcon className="size-4" />
          新規フォルダ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規フォルダの作成</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleAddFolder)} className="flex flex-col gap-4">
            {/* コンテンツ */}
            <div className="text-lg leading-6 text-neutral-900 dark:text-gray-400">
              フォルダ名を入力してください
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
              <Button
                variant="tertiary"
                className="w-[120px]"
                onClick={() => {
                  setIsAddingFolder(false);
                  reset();
                }}
              >
                キャンセル
              </Button>
              <Button
                variant="secondary"
                className="w-[120px]"
                type="submit"
                disabled={!selectedIndexId || isSubmitting || !isValid}
              >
                追加する
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
