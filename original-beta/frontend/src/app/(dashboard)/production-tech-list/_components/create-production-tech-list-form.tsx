'use client';

import { Loader2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setProductionTechList } from '@/app/_store/slice/production-tech-list';
import { cn } from '@/app/_utils/tw-merge';
import { ProductionTechListSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function CreateProductionTechListForm({ className }: Props) {
  const {
    onChangeField,
    control,
    formState: { isValid, isSubmitting },
  } = useFormReduxContext<ProductionTechListSchema>({
    setRedux: setProductionTechList,
  });

  return (
    <div className={cn('flex h-full flex-col relative', className)}>
      <div className="h-full space-y-3 overflow-y-auto pb-[52px]">
        <div>
          <div className="mb-3">
            <FormField
              control={control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>新製品が属する分野</RequiredLabel>
                  <Textarea
                    {...field}
                    className="min-h-[61px] w-full border-neutral-100"
                    placeholder="例：電子機器、医療機器、冷蔵庫、エンジンのボルト、ペットボトル"
                    onBlur={(e) => {
                      onChangeField({ category: e.target.value });
                    }}
                    showCounter
                    // maxLength={10000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mb-3">
            <FormField
              control={control}
              name="focus"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>生産技術に関して特に重視したい点</RequiredLabel>
                  <Textarea
                    {...field}
                    className="min-h-[183px] w-full border-neutral-100"
                    placeholder="例：コスト削減、生産効率の向上、環境への配慮など"
                    onBlur={(e) => {
                      onChangeField({ focus: e.target.value });
                    }}
                    showCounter
                    // maxLength={10000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={control}
              name="issues"
              render={({ field }) => (
                <FormItem>
                  <OptionalLabel>既存の生産技術に対して抱えている課題や問題点</OptionalLabel>
                  <Textarea
                    {...field}
                    onBlur={(e) => {
                      onChangeField({ issues: e.target.value });
                    }}
                    placeholder="例：エネルギー消費が高い、廃棄物が多い"
                    rows={3}
                    showCounter
                    // maxLength={1000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button
          type="submit"
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
          variant="secondary"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : '生産技術を洗い出す'}
        </Button>
      </div>
    </div>
  );
}
