//バックエンドからの呼び出しは仮置き中

import { useEffect } from 'react';
import { toast } from 'sonner';

import { Form } from '@/app/_components/ui/form';
import { LayoutType, LAYOUT_RIGHT_ONLY } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';

import { selectProductComparison } from '@/app/_store/selectors/product-comparison';
import {
  setProductComparisonResult,
  updateProductComparisonInput,
} from '@/app/_store/slice/product-comparison';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { CompareProduct } from '../_actions/compareProduct';
import { ProductComparisonSchema } from '../_utills/schema';
import { ProductComparisonSubmitButton } from './product-comparison-consideration-button';
import ProductComparisonConsiderationForm from './product-comparison-consideration-form';
import ProductComparisonInputForm from './product-comparison-input-form';
import ProductPurposeForm from './product-comparison-purpose-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function ProductComparisonFormArea({ switchLayout, className }: Props) {
  const dispatch = useAppDispatch();
  const { products, purpose, additionalConsiderations } = useAppSelector(selectProductComparison);

  // 適切な初期値を設定して、必須フィールドに値を確実に提供する
  const defaultFormValues = {
    // 製品が存在し、かつ長さが2以上の場合はそれを使用、そうでなければ ['', ''] を使用
    products: products && products.length >= 2 ? products : ['', ''],
    purpose: purpose || '',
    additionalConsiderations: additionalConsiderations || '',
  };

  const form = useFormRedux<ProductComparisonSchema>({
    values: defaultFormValues as ProductComparisonSchema,
    mode: 'onChange',
    defaultValues: defaultFormValues as ProductComparisonSchema,
  });

  // フォームリセットイベントのリスナーを追加
  useEffect(() => {
    const handleReset = () => {
      // フォームを完全にリセット（初期値に戻す）
      form.reset({
        products: ['', ''],
        purpose: '',
        additionalConsiderations: '',
      });
    };

    // イベントリスナーを登録
    window.addEventListener('product-comparison-form-reset', handleReset);

    // クリーンアップ
    return () => {
      window.removeEventListener('product-comparison-form-reset', handleReset);
    };
  }, [form]); // フォームの値が変更されたときにステートを更新
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (
        value.products !== undefined ||
        value.purpose !== undefined ||
        value.additionalConsiderations !== undefined
      ) {
        // 製品が存在し、かつ長さが2以上の場合はそれを使用、そうでなければ ['', ''] を使用
        const productsToUse =
          value.products && value.products.length >= 2
            ? value.products.map((p) => p || '')
            : ['', ''];

        dispatch(
          updateProductComparisonInput({
            products: productsToUse,
            purpose: value.purpose || '',
            additionalConsiderations: value.additionalConsiderations || '',
          })
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [form, dispatch]);

  const onSubmit = async (data: ProductComparisonSchema) => {
    try {
      // FormDataオブジェクトを作成
      const formData = new FormData();

      // 製品名の配列を処理
      if (data.products && data.products.length > 0) {
        data.products.forEach((product, index) => {
          formData.append(`products[${index}]`, product);
        });
      }

      // 用途・目的の追加
      if (data.purpose) {
        formData.append('purpose', data.purpose);
      }

      // 追加考慮事項
      if (data.additionalConsiderations) {
        formData.append('additionalConsiderations', data.additionalConsiderations);
      }

      const response = await CompareProduct(formData);
      if (response && response.success) {
        dispatch(setProductComparisonResult(response.content || ''));

        // フォームの値をReduxに保存
        dispatch(
          updateProductComparisonInput({
            products: data.products || [''],
            purpose: data.purpose || '',
            additionalConsiderations: data.additionalConsiderations || '',
          })
        );

        toast.success(getMessage('I_F_00100', '製品比較表'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error((response && response.message) || getMessage('E_F_00330', '製品比較表'));
      }
    } catch (error) {
      console.error('エラー詳細:', error);

      // エラーがJSON解析に関連するものかチェック
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        toast.error(
          'サーバーからの応答の解析に失敗しました。サーバー側で問題が発生している可能性があります。'
        );
      } else {
        toast.error(getMessage('E_F_00330', '製品比較表'));
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <ProductComparisonInputForm />
          <ProductPurposeForm />
          <ProductComparisonConsiderationForm />
          <ProductComparisonSubmitButton />
        </div>
      </form>
    </Form>
  );
}
