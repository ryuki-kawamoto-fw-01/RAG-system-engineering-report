'use client';

import { FormControl, FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';

import { useFormReduxContext } from '@/app/_hooks/use_form';
import { updateProductComparisonInput } from '@/app/_store/slice/product-comparison';
import { ProductComparisonSchema } from '../_utills/schema';

export default function ProductPurposeForm(): JSX.Element {
  const { control } = useFormReduxContext<ProductComparisonSchema>({
    setRedux: updateProductComparisonInput,
  });

  return (
    <FormField
      control={control}
      name="purpose"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>用途</RequiredLabel>
          <FormControl>
            <Textarea {...field} placeholder="例：PCの周辺機器" className="min-h-[100px]" />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
