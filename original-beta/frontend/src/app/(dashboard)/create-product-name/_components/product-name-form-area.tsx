'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult, setId } from '@/app/_store/slice/create-product-name';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createProductName } from '../_actions/createProductName';
import { CreateProductNameSchema, createProductNameSchema } from '../_utils/schema';
import CreateProductNameButton from './create-product-name-button';
import ProductNameConventionForm from './product-name-convention-form';
import ProductNameRoleForm from './product-name-role-form';
import ProductNameSubjectForm from './product-name-subject-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function ProductNameFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, newProductNameRequest, ...defaultValues } = useAppSelector(
    (state) => state.createProductName
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<CreateProductNameSchema>({
    resolver: zodResolver(createProductNameSchema),
    values: defaultValues,
  });

  const handleCreateProductName = async (e: CreateProductNameSchema) => {
    try {
      const id = uniqueId();
      const response = await createProductName(id, e.subject, e.role, e.convention);
      dispatch(setResult(response.answer));
      dispatch(setId(id));
      toast.success(getMessage('I_F_00030', '作成結果'));
      switchLayout(LAYOUT_RIGHT_ONLY);

      return response;
    } catch {
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleCreateProductName)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[52px]">
          {/* 製品の概要入力フォーム */}
          <ProductNameSubjectForm />
          {/* 製品の特長やポイント入力フォーム */}
          <ProductNameRoleForm />
          {/* 命名規則入力フォーム */}
          <ProductNameConventionForm />
          {/* 作成ボタン */}
          <CreateProductNameButton />
        </div>
      </form>
    </Form>
  );
}
