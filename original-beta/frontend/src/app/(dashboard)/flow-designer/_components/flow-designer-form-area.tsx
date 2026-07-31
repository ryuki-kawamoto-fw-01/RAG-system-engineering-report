import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { FormProvider } from 'react-hook-form';

import { Form } from '@/app/_components/ui/form';
import type { LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import { flowDesignerSchema, type FlowDesignerSchema } from '../_utils/schema';
import FlowConsiderationForm from './flow-consideration-form';
import FlowDesignerSubmitButton from './flow-designer-submit-button';
import FlowTypeForm from './flow-type-form';
import ProcessTextForm from './process-text-form';

interface FlowDesignerFormAreaProps {
  onSubmit: (data: FlowDesignerSchema) => void;
  switchLayout?: (layout: LayoutType) => void;
  className?: string;
}

export default function FlowDesignerFormArea({
  onSubmit,
  switchLayout, // eslint-disable-line @typescript-eslint/no-unused-vars
  className,
}: FlowDesignerFormAreaProps) {
  const { text, type, consideration } = useAppSelector((state) => state.flowDesigner);
  const methods = useFormRedux<FlowDesignerSchema>({
    resolver: zodResolver(flowDesignerSchema),
    values: {
      text,
      type,
      consideration: consideration ?? '',
    },
  });

  // リセットイベントリスナーを設定
  useEffect(() => {
    const handleReset = () => {
      methods.reset({
        text: '',
        type: '',
        consideration: '',
      });
    };

    window.addEventListener('flow-designer-form-reset', handleReset);
    return () => {
      window.removeEventListener('flow-designer-form-reset', handleReset);
    };
  }, [methods]);

  return (
    <div className={cn('flex flex-col', className)}>
      <FormProvider {...methods}>
        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="relative flex h-full flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <ProcessTextForm />
              <FlowTypeForm />
              <FlowConsiderationForm />
            </div>
            <FlowDesignerSubmitButton />
          </form>
        </Form>
      </FormProvider>
    </div>
  );
}
