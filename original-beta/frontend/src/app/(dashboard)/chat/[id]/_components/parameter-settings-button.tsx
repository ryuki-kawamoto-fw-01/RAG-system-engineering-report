'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import SvgSettings from '@/app/_components/icon/button/Settings';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { Form, FormField, FormItem, FormLabel } from '@/app/_components/ui/form';
import RadioCardList from '@/app/_components/ui/radio-card-list';
import { useAppSelector } from '@/app/_store/hooks';
import { DEFAULT_MODEL, models, ModelValue } from '../../../../../../config';
import { Button } from '../../../../_components/ui/button';
import { SettingFormSchema } from '../_utils/schema';

type Props = {
  onSettingsChange: (selectedModel: string) => void;
};

export default function ParameterSettingsButton({ onSettingsChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { chat_selectedModel } = useAppSelector((state) => state.model);

  const form = useForm<z.infer<typeof SettingFormSchema>>({
    resolver: zodResolver(SettingFormSchema),
    defaultValues: {
      model: (chat_selectedModel as ModelValue) ?? DEFAULT_MODEL,
    },
  });
  useEffect(() => {
    if (chat_selectedModel) {
      form.reset({ model: chat_selectedModel as ModelValue }); // Dynamically set default values
    }
  }, [chat_selectedModel, form]);

  const onSubmit = ({ model }: z.infer<typeof SettingFormSchema>) => {
    onSettingsChange(model);

    setIsOpen(false);
    toast.success('パラメータ設定を更新しました');
  };

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setIsOpen(isOpen);
    } else {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Button variant="icon" size="icon" onClick={() => setIsOpen(true)}>
        <SvgSettings className="size-5" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>パラメータ設定</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form id="setting-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              name="model"
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-bold">AIモデル</FormLabel>
                  <RadioCardList value={field.value!} options={models} onChange={field.onChange} />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="tertiary" onClick={handleClose} className="w-[120px]">
            キャンセル
          </Button>
          <Button type="submit" form="setting-form" variant="secondary" className="w-[120px]">
            設定する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
