import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
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
import { Form, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
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
import { createQA } from '../_actions/createQA';
import { updateQA } from '../_actions/updateQA';
import { CATEGORY_VALUES, SUB_CATEGORY_MAP } from '../_constant';
import { QA, Category, SubCategory } from '../_type';
import { QUESTION_MAX_LENGTH, ANSWER_MAX_LENGTH, QASchema } from '../_utils/schema';

type Props = {
  qa: QA | null;
  handleClose: () => void;
};

export default function QAForm({ qa, handleClose }: Props) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>(
    qa?.id === null ? '' : (qa?.category ?? '')
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | ''>(
    qa?.id === null ? '' : (qa?.work_category ?? '')
  );
  const form = useForm<z.infer<typeof QASchema>>({
    resolver: zodResolver(QASchema),
    defaultValues: {
      category: '',
      work_category: '',
      question: qa?.question,
      answer: qa?.answer || '',
    },
  });
  const {
    control,
    handleSubmit,
    formState: { isLoading },
    reset,
  } = form;

  React.useEffect(() => {
    // qaが切り替わったときに初期値をリセット
    if (qa) {
      setSelectedCategory(qa.id === null ? '' : (qa.category ?? ''));
      setSelectedSubCategory(qa.id === null ? '' : (qa.work_category ?? ''));

      reset({
        category: qa.category,
        work_category: qa.work_category,
        question: qa.question,
        answer: qa.answer,
      });
    }
  }, [qa, reset]);

  if (qa === null) {
    return null;
  }
  const isNew = qa.id === null;
  const upsertLabel = isNew ? '登録' : '更新';

  const onSubmit = async (data: z.infer<typeof QASchema>) => {
    let res;
    if (isNew) {
      res = await createQA(data);
    } else {
      res = await updateQA(data, qa);
    }

    if (res.success) {
      toast.success(getMessage(isNew ? 'I_F_00160' : 'I_F_00170', 'Q&A'));
    } else {
      toast.error(getMessage(isNew ? 'E_F_00390' : 'E_F_00400', 'Q&A'));
    }

    router.refresh();
    handleCloseClick();
  };

  const handleCloseClick = () => {
    reset();
    handleClose();
  };

  // 選択中のカテゴリに対応するサブカテゴリ配列
  const subCategoryOptions: { value: SubCategory; label: string }[] =
    selectedCategory && SUB_CATEGORY_MAP[selectedCategory]
      ? SUB_CATEGORY_MAP[selectedCategory].map((sub) => ({
          value: sub,
          label: sub,
        }))
      : [];

  return (
    <Dialog open onOpenChange={handleCloseClick}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Q&A{upsertLabel}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="my-2.5 flex flex-col space-y-4">
            <FormField
              control={control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex items-start gap-x-3 space-y-0">
                  <RequiredLabel className="h-9 w-[138px] shrink-0 justify-between">
                    カテゴリー
                  </RequiredLabel>
                  <FormItem>
                    <input type="hidden" name="category" value={selectedCategory} />
                    <input type="hidden" name="work_category" value={selectedSubCategory} />
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategory(value as Category);
                        setSelectedSubCategory('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {CATEGORY_VALUES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
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
              control={control}
              name="work_category"
              render={({ field }) => (
                <FormItem className="flex items-start gap-x-3 space-y-0">
                  <RequiredLabel className="h-9 w-[138px] shrink-0 justify-between">
                    サブカテゴリー
                  </RequiredLabel>
                  <FormItem>
                    <Select
                      value={selectedSubCategory}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedSubCategory(value as SubCategory);
                      }}
                      disabled={!selectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {subCategoryOptions.map(({ value, label }) => (
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
              control={control}
              name="question"
              render={({ field }) => (
                <FormItem className="flex items-start gap-x-3 space-y-0">
                  <RequiredLabel className="h-9 w-[138px] shrink-0 justify-between">
                    質問
                  </RequiredLabel>
                  <FormItem className="flex-1">
                    <Textarea
                      {...field}
                      defaultValue={qa.question}
                      showCounter
                      maxLength={QUESTION_MAX_LENGTH}
                      className="h-[150px] whitespace-normal"
                    />
                    <FormMessage />
                  </FormItem>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="answer"
              render={({ field }) => (
                <FormItem className="flex items-start gap-x-3 space-y-0">
                  <RequiredLabel className="h-9 w-[138px] shrink-0 justify-between">
                    回答
                  </RequiredLabel>
                  <FormItem className="flex-1">
                    <Textarea
                      {...field}
                      defaultValue={qa.answer}
                      showCounter
                      maxLength={ANSWER_MAX_LENGTH}
                      className="h-[150px] whitespace-normal"
                    />
                    <FormMessage />
                  </FormItem>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="tertiary" onClick={handleCloseClick} className="w-[120px]">
                キャンセル
              </Button>
              <Button type="submit" variant="secondary" disabled={isLoading} className="w-[120px]">
                設定する
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
