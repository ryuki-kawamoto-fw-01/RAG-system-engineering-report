import { zodResolver } from '@hookform/resolvers/zod';
import { DialogTitle } from '@radix-ui/react-dialog';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/app/_components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/app/_components/ui/dialog';
import { Form, FormField, FormControl, FormItem, FormMessage } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import RequiredLabel from '@/app/_components/ui/required-label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { getMessage } from '@/app/_utils/message';
import { createBanWord } from '../_actions/createBanWord';
import { updateBanWord } from '../_actions/updateBanWord';
import { CATEGORY_OPTIONS } from '../_constant';
import { BanWord } from '../_type';
import { BanWordSchema } from '../_utils/schema';

type Props = {
  banWord: BanWord | null;
  handleClose: () => void;
};

export default function BanWordForm({ banWord, handleClose }: Props) {
  const router = useRouter();
  const form = useForm<z.infer<typeof BanWordSchema>>({
    resolver: zodResolver(BanWordSchema),
    defaultValues: {
      id: null,
      banWord: '',
      category: '',
    },
  });

  const { control, handleSubmit, formState, setError, reset } = form;

  const { isLoading } = formState;

  const isNew = banWord?.id === null;
  const upsertLabel = isNew ? '登録' : '更新';

  React.useEffect(() => {
    if (banWord) {
      reset({
        id: banWord.id || null,
        banWord: banWord.banWord || '',
        category: isNew ? '' : banWord.category || '',
      });
    }
  }, [banWord, reset, isNew]);

  if (banWord === null) {
    return null;
  }

  const onSubmit = async (data: z.infer<typeof BanWordSchema>) => {
    const formData = new FormData();
    formData.append('id', data.id || '');
    formData.append('banWord', data.banWord);
    formData.append('category', data.category);

    let res;
    if (isNew) {
      res = await createBanWord(formData);
    } else {
      res = await updateBanWord(formData, banWord);
    }

    if (res.success) {
      toast.success(getMessage(isNew ? 'I_F_00160' : 'I_F_00170', '禁止ワード'));
      router.refresh();
      handleClose();
    } else {
      if (res.errors) {
        if (res.errors.category) {
          setError('category', {
            type: 'server',
            message: res.errors.category[0],
          });
        }
      } else {
        toast.error(getMessage(isNew ? 'E_F_00390' : 'E_F_00400', '禁止ワード'));
        router.refresh();
        handleClose();
      }
    }
  };

  const closeDialog = () => {
    handleClose();
    reset();
  };

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">禁止ワード{upsertLabel}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={control}
              name="banWord"
              render={({ field }) => (
                <FormItem className="flex items-start gap-x-3 space-y-0">
                  <RequiredLabel className="h-9 w-[108px] shrink-0 justify-between">
                    禁止ワード
                  </RequiredLabel>
                  <FormItem className="flex-1">
                    <Input {...field} type="text" name="banWord" />
                    <FormMessage />
                  </FormItem>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex items-start gap-x-3 space-y-0">
                  <RequiredLabel className="h-9 w-[108px] shrink-0 justify-between">
                    カテゴリー
                  </RequiredLabel>
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value!}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {CATEGORY_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button variant="tertiary" className="w-[120px]" onClick={closeDialog}>
                キャンセル
              </Button>
              <Button type="submit" variant="secondary" className="w-[120px]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin dark:text-white" />
                    設定を適応中...
                  </>
                ) : (
                  <>設定する</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
