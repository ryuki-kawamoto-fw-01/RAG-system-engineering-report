'use client';

import React from 'react';

import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Slider } from '@/app/_components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { INITIAL_SUMMARY_LENGTH, setSummary } from '@/app/_store/slice/summary';
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
    setValue,
  } = useFormReduxContext<SummarySchema>({
    setRedux: setSummary,
  });

  const handleTabsChange = (value: string) => {
    onChangeField({ activeTab: value });
    switch (value) {
      case 'short':
        setValue('summaryLength', 100);
        break;
      case 'long':
        setValue('summaryLength', 300);
        break;
      case 'custom':
        setValue('summaryLength', INITIAL_SUMMARY_LENGTH);
        break;
    }
  };

  return (
    <div className={cn('flex h-full flex-col relative', className)}>
      <div className="h-full space-y-3 overflow-y-auto pb-[48px]">
        <FormField
          control={control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>要約したい文章</RequiredLabel>
              <Textarea
                {...field}
                className="min-h-[366px] w-full"
                onKeyUp={(e) => {
                  onChangeField({ content: (e.target as HTMLTextAreaElement).value });
                }}
                showCounter
              />
            </FormItem>
          )}
        />
        <div className="space-y-1.5">
          <RequiredLabel>要約モード</RequiredLabel>
          <FormField
            control={control}
            name="activeTab"
            render={(col) => (
              <Tabs value={col.field.value!} onValueChange={handleTabsChange}>
                <TabsList>
                  <TabsTrigger value="short">短文</TabsTrigger>
                  <TabsTrigger value="long">長文</TabsTrigger>
                  <TabsTrigger value="custom">文字数指定</TabsTrigger>
                </TabsList>
                <TabsContent value="custom">
                  <FormField
                    control={control}
                    name="summaryLength"
                    render={({ field }) => (
                      <FormItem>
                        <div className="mb-4">
                          <div className="mb-1 flex justify-between">
                            <span className="text-sm">文字数目安</span>
                            <span className="text-xs">{field.value!.toLocaleString()}</span>
                          </div>
                          <Slider
                            value={[field.value!]}
                            max={1000}
                            min={100}
                            step={100}
                            onValueChange={(e) => onChangeField({ summaryLength: e[0] })}
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            )}
          />
        </div>
        <FormField
          control={control}
          name="consideration"
          render={({ field }) => (
            <FormItem>
              <OptionalLabel>考慮事項</OptionalLabel>
              <Textarea
                {...field}
                onKeyUp={(e) => {
                  onChangeField({ consideration: (e.target as HTMLTextAreaElement).value });
                }}
                placeholder="例：決定事項については、背景が分かるように要約する"
                rows={3}
                className="min-h-[150px]"
              />
            </FormItem>
          )}
        />
        <Button
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
          variant="secondary"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-6 animate-spin" />
              要約中です
            </>
          ) : (
            '要約する'
          )}
        </Button>
      </div>
    </div>
  );
}
