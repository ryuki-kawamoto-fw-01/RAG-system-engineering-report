import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';

import { Form } from '@/app/_components/ui/form';
import { flowDesignerSchema } from '../_schemas/flowDesignerSchema';
import type { FlowDesignerRequest } from '../_store/types';
import FlowDesignerConsiderationForm from './consideration-form';
import FlowDesignerSubmitButton from './submit-button';
import FlowDesignerTextForm from './text-form';
import FlowDesignerTypeForm from './type-form';

interface FlowDesignerFormAreaProps {
  onSubmit: (data: FlowDesignerRequest) => void;
}

export default function FlowDesignerFormArea({ onSubmit }: FlowDesignerFormAreaProps) {
  const methods = useForm<FlowDesignerRequest>({
    resolver: zodResolver(flowDesignerSchema),
    defaultValues: {
      text: '',
      type: '',
      consideration: '',
    },
  });

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="flex h-full flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            <FlowDesignerTextForm />
            <FlowDesignerTypeForm />
            <FlowDesignerConsiderationForm />
          </div>
          <FlowDesignerSubmitButton />
        </form>
      </Form>
    </FormProvider>
  );
}
