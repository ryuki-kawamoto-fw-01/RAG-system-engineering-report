import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult } from '@/app/_store/slice/create-product-name';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { createNewProductName } from '../_actions/createNewproductName';
import { CreateNewProductNameSchema, createNewProductNameSchema } from '../_utils/schema';
import NewProductNameRequestForm from './product-name-request-form';
import ProductNameResultArea from './product-name-result-area';

type Props = {
  className?: string;
};

export default function ProductNameResults({ className }: Props) {
  const { newProductNameRequest, result } = useAppSelector((state) => state.createProductName);
  const dispatch = useAppDispatch();
  const form = useFormRedux<CreateNewProductNameSchema>({
    resolver: zodResolver(createNewProductNameSchema),
    values: {
      newProductNameRequest,
      result,
    },
  });

  const handleCreateNewProductName = async (e: CreateNewProductNameSchema) => {
    try {
      const response = await createNewProductName(e.result, e.newProductNameRequest!);
      dispatch(setResult(response.answer));
      toast.success(getMessage('I_F_00040', '作成結果'));
      return response;
    } catch {
      toast.error(getMessage('E_F_00330', 'ネーミング案'));
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleCreateNewProductName)}
        className={cn('flex h-full flex-col relative', className)}
      >
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* 製品ネーミング案作成結果エリア */}
          <ProductNameResultArea />
          {/* 追加で生成AIに依頼するエリア */}
          <NewProductNameRequestForm className="mt-3" />
        </div>
      </form>
    </Form>
  );
}
