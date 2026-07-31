import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import React from 'react';
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
import { CATEGORY_OPTIONS } from '@/app/_constants/prompt-template';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { getMessage } from '@/app/_utils/message';
import { createPromptTemplate } from '../_actions/createPromptTemplate';
import { updatePromptTemplate } from '../_actions/updatePromptTemplate';
import { MAX_TEXT_LENGTH, PromptTemplateSchema } from '../_utils/schema';

type Props = {
  template: PromptTemplate;
  handleClose: () => void;
};

export default function TemplateForm({ template, handleClose }: Props) {
  const router = useRouter();
  const form = useForm<z.infer<typeof PromptTemplateSchema>>({
    resolver: zodResolver(PromptTemplateSchema),
    defaultValues: {
      category: template.category,
      title: template.title,
      content: template.content,
    },
  });
  const { isLoading } = form.formState;

  const isNew = template.id === undefined;
  const upsertLabel = isNew ? '登録' : '更新';

  const onSubmit = async (data: z.infer<typeof PromptTemplateSchema>) => {
    let res;
    if (isNew) {
      res = await createPromptTemplate(data);
    } else {
      res = await updatePromptTemplate(data, template.id!);
    }

    if (res.success) {
      toast.success(getMessage(isNew ? 'I_F_00160' : 'I_F_00170', 'プロンプト'));
    } else {
      toast.error(getMessage(isNew ? 'E_F_00390' : 'E_F_00400', 'プロンプト'));
    }

    router.refresh();
    handleClose();
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>プロンプト{upsertLabel}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id="prompt-template-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex items-start gap-x-3 space-y-0">
                  <RequiredLabel className="h-9 w-[108px] shrink-0 justify-between">
                    カテゴリー
                  </RequiredLabel>
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value!}>
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
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="flex items-start gap-x-3 space-y-0">
                  <RequiredLabel className="h-9 w-[108px] shrink-0 justify-between">
                    タイトル
                  </RequiredLabel>
                  <FormItem className="flex-1">
                    <Input type="text" {...field} />
                    <FormMessage />
                  </FormItem>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex items-start gap-x-3 space-y-0">
                  <RequiredLabel className="h-9 w-[108px] shrink-0 justify-between">
                    プロンプト
                  </RequiredLabel>
                  <FormItem className="flex-1">
                    <Textarea
                      defaultValue={template.content}
                      showCounter
                      maxLength={MAX_TEXT_LENGTH}
                      className="h-[240px] w-full whitespace-normal"
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="tertiary" onClick={handleClose} className="w-[120px]">
            キャンセル
          </Button>
          <Button
            type="submit"
            form="prompt-template-form"
            variant="secondary"
            disabled={isLoading}
            className="w-[120px]"
          >
            設定する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
