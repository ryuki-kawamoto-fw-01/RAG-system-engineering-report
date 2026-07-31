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
import {
  MODEL_VALUES,
  models,
  ModelValue,
  SEARCH_METHOD_VALUES,
  searchMethods,
  SearchMethodValue,
} from '../../../../../../config';
import { Button } from '../../../../_components/ui/button';

const SettingFormSchema = z.object({
  model: z.enum(MODEL_VALUES, {
    message: '許可されたモデルを選択してください',
  }),
  searchMethod: z.enum(SEARCH_METHOD_VALUES, {
    message: '許可された検索手法を選択してください',
  }),
});

type Props = {
  onSettingsChange: (selectedModel: string, selectedSearchMethod: string) => void;
};

export default function ParameterSettingsButton({ onSettingsChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { rag_selectedModel, rag_selectedSearchMethod } = useAppSelector((state) => state.model);

  const form = useForm<z.infer<typeof SettingFormSchema>>({
    resolver: zodResolver(SettingFormSchema),
    defaultValues: {
      model: rag_selectedModel as ModelValue,
      searchMethod: rag_selectedSearchMethod as SearchMethodValue,
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (rag_selectedModel && rag_selectedSearchMethod) {
      reset({
        model: rag_selectedModel as ModelValue,
        searchMethod: rag_selectedSearchMethod as SearchMethodValue,
      });
    }
  }, [rag_selectedModel, rag_selectedSearchMethod, reset]);

  const onSubmit = ({ model, searchMethod }: z.infer<typeof SettingFormSchema>) => {
    onSettingsChange(model, searchMethod);

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
    <div className="flex flex-1 items-center justify-end">
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <Button variant="icon" size="icon" onClick={() => setIsOpen(true)}>
          <SvgSettings className="size-5" />
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>パラメータ設定</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form id="setting-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                name="model"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">AIモデル</FormLabel>
                    <RadioCardList
                      value={field.value!}
                      options={models}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />
              <FormField
                name="searchMethod"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">検索手法</FormLabel>
                    <RadioCardList
                      value={field.value!}
                      options={searchMethods}
                      onChange={field.onChange}
                    />
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
    </div>
  );
}
