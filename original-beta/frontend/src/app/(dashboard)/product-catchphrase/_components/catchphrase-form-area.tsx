'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import FileDropAreaWithTempStorage from '@/app/_components/file-drop-area-with-temp-storage';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { selectProductCatchphrase } from '@/app/_store/selectors/product-catchphrase';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Form, FormItem } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setProductCatchphrase, setResult, setId } from '../../../_store/slice/product-catchphrase';
import { productCatchphrase } from '../_actions/productCatchphrase';
import {
  ALLOWED_FILE_TYPES,
  ProductCatchphraseTextSchema,
  ProductCatchphraseFileSchema,
  productCatchphraseTextSchema,
  productCatchphraseFileSchema,
} from '../_utils/schema';
import CompetitorForm from './competitor-form';
import ConsiderationForm from './consideration-form';
import FileConsiderationForm from './file-consideration-form';
import ProductCatchphraseButton from './product-catchphrase-button';
import ProductInformationForm from './product-information-form';
import ProductNameForm from './product-name-form';
import TargetCustomerForm from './target-customer-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function CatchphraseFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, ...defaultValues } = useAppSelector(selectProductCatchphrase);
  const [selectedTab, setSelectedTab] = useState<'form-input' | 'file-upload'>('form-input');
  const dispatch = useAppDispatch();
  const form = useFormRedux<ProductCatchphraseTextSchema | ProductCatchphraseFileSchema>({
    resolver: zodResolver(
      selectedTab === 'form-input' ? productCatchphraseTextSchema : productCatchphraseFileSchema
    ),
    values: defaultValues,
  });

  const handleProductCatchphrase = async (
    e: ProductCatchphraseTextSchema | ProductCatchphraseFileSchema
  ) => {
    try {
      const formData = new FormData();

      if (selectedTab === 'form-input') {
        const values = e as ProductCatchphraseTextSchema;
        formData.append('productName', values.name);
        formData.append('productInformation', values.information);
        formData.append('targetCustomer', values.target);
        formData.append('competitor', values.competitor);
        if (values.consideration) {
          formData.append('consideration', values.consideration);
        }
      } else if (selectedTab === 'file-upload' && e.fileList) {
        const values = e as ProductCatchphraseFileSchema;
        // FileList または FileReference[] を JSON 文字列として送信
        if (values.fileList instanceof FileList) {
          for (const file of values.fileList) {
            formData.append('fileList', file);
          }
        } else {
          formData.append('fileList', JSON.stringify(values.fileList));
        }
        if (values.fileConsideration) {
          formData.append('fileConsideration', values.fileConsideration);
        }
      }

      const id = uniqueId();
      const response = await productCatchphrase(id, formData, selectedTab);

      if ('error' in response) {
        toast.error(<ReactMarkdown>{response.error}</ReactMarkdown>);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);

        return response;
      }
    } catch {
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleProductCatchphrase)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="h-full space-y-3 overflow-y-auto pb-[48px]">
          {/* 製品情報入力方法選択 */}
          <FormItem>
            <RequiredLabel>製品情報の入力方法</RequiredLabel>
            <Tabs defaultValue="form-input">
              <TabsList>
                <TabsTrigger value="form-input" onClick={() => setSelectedTab('form-input')}>
                  フォーム入力
                </TabsTrigger>
                <TabsTrigger value="file-upload" onClick={() => setSelectedTab('file-upload')}>
                  ファイルアップロード
                </TabsTrigger>
              </TabsList>
              <TabsContent value="form-input">
                <div className="space-y-3">
                  {/* 製品名入力フォーム */}
                  <ProductNameForm />
                  {/* 製品情報入力フォーム */}
                  <ProductInformationForm />
                  {/* ターゲット顧客入力フォーム */}
                  <TargetCustomerForm />
                  {/* 競合との比較入力フォーム */}
                  <CompetitorForm />
                </div>
              </TabsContent>
              <TabsContent value="file-upload">
                <FileDropAreaWithTempStorage
                  name="fileList"
                  setRedux={setProductCatchphrase}
                  accept={ALLOWED_FILE_TYPES}
                  uploadPrefix="temp/product_catchphrase"
                />
              </TabsContent>
            </Tabs>
          </FormItem>
          {/* 考慮事項入力フォーム（共通） */}
          {selectedTab === 'form-input' ? <ConsiderationForm /> : <FileConsiderationForm />}
        </div>
        {/* キャッチコピー作成ボタン */}
        <ProductCatchphraseButton selectedTab={selectedTab} />
      </form>
    </Form>
  );
}
