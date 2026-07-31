import { useState, useEffect } from 'react';
import SvgAdd from '@/app/_components/icon/button/Add';
import SvgClose from '@/app/_components/icon/button/Close';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';

import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { updateProductComparisonInput } from '@/app/_store/slice/product-comparison';
import { ProductComparisonSchema } from '../_utills/schema';

export default function ProductComparisonInputArea() {
  const { onChangeField, control, getValues } = useFormReduxContext<ProductComparisonSchema>({
    setRedux: updateProductComparisonInput,
  });

  // 製品フィールドの数を管理（デフォルトで2つに変更）
  const [productFields, setProductFields] = useState<string[]>(['product-0', 'product-1']);

  // 初期化時に既存の製品数を確認（初回のみ実行）
  useEffect(() => {
    const values = getValues();
    if (!values.products || values.products.length < 2) {
      // 製品が2つ未満なら2つに初期化
      onChangeField({ products: ['', ''] });
      setProductFields(['product-0', 'product-1']);
    } else {
      // 2つ以上ならその数だけフィールドを用意（最大4つまで）
      const productsToUse = values.products.slice(0, 4);
      setProductFields(productsToUse.map((_, index) => `product-${index}`));
    }
    // 初回のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleReset = () => {
      // 値を完全にクリア（空の製品2つにする）
      const emptyProducts = ['', ''];

      // フィールド数を2つに設定
      setProductFields(['product-0', 'product-1']);

      // Reduxの状態も2つの空の製品に更新
      onChangeField({ products: emptyProducts });

      // フォームフィールドの値を直接リセット
      // これにより各フィールドのinput値が確実に空になる
      emptyProducts.forEach((_, index) => {
        // フォームフィールドの値を強制的にクリア
        const fieldName = `products.${index}`;
        try {
          // 強制的に値をクリア
          const fieldElement = document.querySelector(
            `input[name="${fieldName}"]`
          ) as HTMLInputElement;
          if (fieldElement) {
            fieldElement.value = '';
          }
        } catch (error) {
          console.error(`フィールド ${fieldName} のリセットに失敗:`, error);
        }
      });
    };

    // イベントリスナーを登録
    window.addEventListener('product-comparison-form-reset', handleReset);

    // クリーンアップ
    return () => {
      window.removeEventListener('product-comparison-form-reset', handleReset);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 製品フィールドを追加
  const addProductField = () => {
    // 最大4つまで厳格にチェック
    if (productFields.length >= 4) {
      console.warn('製品フィールドは最大4つまでです');
      return;
    }

    // 新しいフィールドIDを現在の長さに基づいて生成
    const newFieldId = `product-${productFields.length}`;
    const newFields = [...productFields, newFieldId];
    setProductFields(newFields);

    // 現在の製品リストを取得して新しい空の製品を追加
    const currentProducts = getValues().products || [];
    // 既存の製品数も4つ未満の場合のみ追加
    if (currentProducts.length < 4) {
      const updatedProducts = [...currentProducts, ''];
      onChangeField({ products: updatedProducts });
    }
  };

  // 製品フィールドを削除
  const removeProductField = (index: number) => {
    if (productFields.length > 1) {
      // フィールドIDの配列から削除
      const newFields = productFields.filter((_, i) => i !== index);
      // フィールドIDを連番に振り直す（削除後の順序を保持）
      const reindexedFields = newFields.map((_, i) => `product-${i}`);
      setProductFields(reindexedFields);

      // 現在の製品リストを取得して指定のインデックスを削除
      const currentProducts = getValues().products || [];
      const updatedProducts = currentProducts.filter((_, i) => i !== index);
      onChangeField({ products: updatedProducts });
    }
  };

  // 製品名の変更を処理
  const handleProductChange = (index: number, value: string) => {
    const currentProducts = getValues().products || [];
    // インデックスが範囲内かチェック
    if (index >= 0 && index < currentProducts.length) {
      const updatedProducts = [...currentProducts];
      updatedProducts[index] = value;
      onChangeField({ products: updatedProducts });
    }
  };

  return (
    <div>
      <RequiredLabel>製品名</RequiredLabel>

      {/* 製品フィールドを動的に生成 */}
      {productFields.map((fieldId, index) => (
        <div key={fieldId} className="mt-1.5 flex items-center">
          <FormField
            control={control}
            name={`products.${index}`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <div className="flex items-center">
                  <Input
                    {...field}
                    onBlur={(e) => {
                      handleProductChange(index, e.target.value);
                    }}
                    placeholder={`製品${index + 1}`}
                    maxLength={100}
                  />

                  {/* 削除ボタン（最低2つは残す） */}
                  {productFields.length > 2 && (
                    <Button type="button" variant="icon" onClick={() => removeProductField(index)}>
                      <SvgClose className="size-5 text-neutral-800" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
      <div className="mt-1.5 flex justify-center">
        <Button
          type="button"
          size="sm"
          variant="tertiary"
          onClick={addProductField}
          disabled={productFields.length >= 4}
        >
          <SvgAdd className="mr-1 size-3" />
          製品を追加
        </Button>
      </div>
    </div>
  );
}
