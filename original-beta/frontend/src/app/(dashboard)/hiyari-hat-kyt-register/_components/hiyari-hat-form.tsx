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
import RequiredLabel from '@/app/_components/ui/required-label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { Textarea } from '@/app/_components/ui/textarea';
import { getMessage } from '@/app/_utils/message';
import { HiyariHatRegisterModel } from '../../../../../config';
import { createHiyariHat } from '../_actions/create_hiyari_hat';
import { updateHiyariHat } from '../_actions/update_hiyari_hat';
import { HIYARI_HAT_CATEGORY_OPTIONS } from '../_constant';
import { hiyariHatRegisterSchema } from '../_utils/schima';

type Props = {
  hiyariHat: HiyariHatRegisterModel | null;
  handleClose: () => void;
};

export default function HiyariHatForm({ hiyariHat, handleClose }: Props) {
  const router = useRouter();
  const form = useForm<z.infer<typeof hiyariHatRegisterSchema>>({
    resolver: zodResolver(hiyariHatRegisterSchema),
    defaultValues: {
      category: '',
      incident: '',
      counterMeasure: '',
    },
  });

  const { control, handleSubmit, formState, reset } = form;
  const { isLoading } = formState;

  // idがnullまたはundefinedまたは空文字の場合は新規作成
  const isNew = !hiyariHat?.id;
  const upsertLabel = isNew ? '登録' : '更新';

  React.useEffect(() => {
    if (hiyariHat) {
      reset({
        category: hiyariHat.category || '',
        incident: hiyariHat.incident || '',
        counterMeasure: hiyariHat.counterMeasure || '',
      });
    }
  }, [hiyariHat, reset]);

  if (hiyariHat === null) {
    return null;
  }

  const onSubmit = async (data: z.infer<typeof hiyariHatRegisterSchema>) => {
    let res;
    if (isNew) {
      // QAと同様にデータオブジェクトを渡す
      res = await createHiyariHat(data);
    } else {
      // QAと同様にデータオブジェクトを渡す
      res = await updateHiyariHat(data, hiyariHat);
    }

    if (res.success) {
      toast.success(getMessage(isNew ? 'I_F_00160' : 'I_F_00170', 'ヒヤリハット登録'));
      router.refresh();
      handleClose();
    } else {
      const errorMessage =
        res.message || getMessage(isNew ? 'E_F_00390' : 'E_F_00400', 'ヒヤリハット登録');
      toast.error(errorMessage);
    }
  };

  const closeDialog = () => {
    handleClose();
  };

  return (
    <Dialog open={!!hiyariHat} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ヒヤリハット{upsertLabel}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>カテゴリー</RequiredLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {HIYARI_HAT_CATEGORY_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="incident"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>ヒヤリハット事例</RequiredLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ヒヤリハット事例を入力してください"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="counterMeasure"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>対策</RequiredLabel>
                  <FormControl>
                    <Textarea placeholder="対策を入力してください" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button variant="tertiary" className="w-[120px]" onClick={closeDialog} type="button">
                キャンセル
              </Button>
              <Button type="submit" variant="secondary" className="w-[120px]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin dark:text-white" />
                    設定を適応中...
                  </>
                ) : (
                  <>{upsertLabel}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
