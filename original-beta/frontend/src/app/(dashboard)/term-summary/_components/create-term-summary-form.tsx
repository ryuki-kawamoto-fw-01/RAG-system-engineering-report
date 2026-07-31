'use client';
import React from 'react';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setSummary } from '@/app/_store/slice/term-summary';
import { cn } from '@/app/_utils/tw-merge';
import { SummarySchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function CreateSummaryForm({ className }: Props) {
  const {
    onChangeField,
    control,
    formState: { isValid, isSubmitting },
  } = useFormReduxContext<SummarySchema>({
    setRedux: setSummary,
  });

  return (
    <div className={cn('flex h-full flex-col relative', className)}>
      <div className="h-full space-y-3 overflow-y-auto">
        <div className="mb-3">
          <FormField
            control={control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel>解説して欲しい用語の分野</RequiredLabel>
                <Input
                  {...field}
                  id="domain"
                  className="w-1/3 text-base"
                  placeholder="例：IT系"
                  onKeyUp={(e) => {
                    onChangeField({ domain: (e.target as HTMLInputElement).value });
                  }}
                />
              </FormItem>
            )}
          />
        </div>
        <div className="mb-3">
          <FormField
            control={control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel>要約したい文章</RequiredLabel>
                <Textarea
                  {...field}
                  id="content"
                  className="min-h-[320px]"
                  placeholder="要約及び専門用語の解説をしたい文章を入力してください"
                  onKeyUp={(e) => {
                    onChangeField({ content: (e.target as HTMLInputElement).value });
                  }}
                />
              </FormItem>
            )}
          />
        </div>
        <div className="mb-3">
          <FormField
            control={control}
            name="consideration"
            render={({ field }) => (
              <FormItem>
                <OptionalLabel>考慮事項</OptionalLabel>
                <Textarea
                  {...field}
                  id="consideration"
                  className="min-h-[120px]"
                  onKeyUp={(e) => {
                    onChangeField({ consideration: (e.target as HTMLTextAreaElement).value });
                  }}
                  placeholder="例：決定事項については、背景が分かるように要約する"
                />
              </FormItem>
            )}
          />
        </div>
        <Button
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
          variant="secondary"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting && <Spinner className="mr-2 size-6 animate-spin" />}
          {isSubmitting ? '作成中です' : '要約・解説する'}{' '}
        </Button>
      </div>
    </div>
  );
}
