// 文章校正設定エリア
import { zodResolver } from '@hookform/resolvers/zod';

import { JSX, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectTroubleShooting } from '@/app/_store/selectors/trouble-shooting';
import { setId, setResult } from '@/app/_store/slice/trouble-shooting';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createTroubleShootingGuide } from '../_actions/troubleShootingGuide';
import {
  TroubleShootingSchema,
  troubleShootingFileSchema,
  troubleShootingSchema,
} from '../_utils/schema';

import ProductNameForm from './product-name-form';
import ProductPurposeForm from './product-purpose-form';
import ProductSpecificationForm, { SelectTab } from './product-specification-form';
import SubmitButton from './submit-button';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function InputFormArea({ switchLayout, className }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const [selectedTab, setSelectedTab] = useState<SelectTab>('direct-input');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ...defaultValues } = useAppSelector(selectTroubleShooting);
  const form = useFormRedux<TroubleShootingSchema>({
    resolver: zodResolver(
      selectedTab === 'file-upload' ? troubleShootingFileSchema : troubleShootingSchema
    ),
    values: defaultValues as TroubleShootingSchema,
  });

  const onSubmit = async (e: TroubleShootingSchema) => {
    try {
      const formData = new FormData();
      if (selectedTab === 'file-upload') {
        // FileReference[]としてJSON文字列化して送信
        formData.append('productSpecificationFiles', JSON.stringify(e.productSpecificationFiles));
      }
      if (selectedTab === 'direct-input') {
        formData.append('productSpecificationText', e.productSpecificationText);
      }
      formData.append('productName', e.productName);
      formData.append('productPurpose', e.productPurpose);
      const id = uniqueId();
      const response = await createTroubleShootingGuide(id, formData, selectedTab);

      if ('error' in response) {
        toast.error(<ReactMarkdown>{response.error}</ReactMarkdown>);
      } else {
        dispatch(setId(id));
        dispatch(setResult(response.result));

        toast.success(getMessage('I_F_00030', 'トラブルシューティングガイド'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      }
    } catch (error) {
      console.error('Error creating trouble shooting guide:', error);
      toast.error(getMessage('E_F_00110', 'トラブルシューティングガイド'));
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('h-full flex flex-col relative', className)}
      >
        <div className="h-full space-y-3 overflow-y-auto pb-[48px]">
          {/* 製品仕様エリア */}
          <ProductSpecificationForm onTabClick={(v) => setSelectedTab(v)} />
          {/* 製品名エリア */}
          <ProductNameForm />
          {/* 製品の目的エリア */}
          <ProductPurposeForm />
          {/* 送信ボタンエリア */}
          <SubmitButton selectedTab={selectedTab} />
        </div>
      </form>
    </Form>
  );
}
