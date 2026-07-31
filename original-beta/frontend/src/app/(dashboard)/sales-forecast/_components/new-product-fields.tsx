import { useState, useRef, useEffect } from 'react';
import { FormField, FormItem } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/sales-forecast';
import { Checkbox } from '../../../_components/ui/checkbox';
import { Textarea } from '../../../_components/ui/textarea';
import { PRODUCT_CATEGORY } from '../_constant';
import { SalesForecastSchema } from '../_utils/schema';

export default function NewProductFields() {
  const { onChangeField, control } = useFormReduxContext<SalesForecastSchema>({
    setRedux: add, // 入力値が変わったらaddでReduxに保存
  });
  // その他の入力欄の状態管理
  const [otherCategory, setOtherCategory] = useState(''); // otherCategory：今の入力内容、setOtherCategory：その値を変更するための関数
  const otherInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setOtherCategory(control._defaultValues?.productCategoryOther ?? '');
  }, [control._defaultValues?.productCategoryOther]);

  return (
    <div>
      {/* 見出し */}
      <h2 className="mb-4 text-lg font-bold">新製品情報</h2>
      {/* 新製品名 */}
      <FormField
        control={control}
        name="productName"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>新製品名</RequiredLabel>
            <Input
              {...field}
              id="productName"
              placeholder="例：営業文書自動生成ツール"
              onKeyUp={(e) => {
                onChangeField({ productName: (e.target as HTMLInputElement).value });
              }}
            />
          </FormItem>
        )}
      />

      {/* 製品カテゴリ */}
      <FormField
        control={control}
        name="productCategory"
        render={({ field }) => {
          const value: string[] = Array.isArray(field.value) ? field.value : [];
          const allChecked = PRODUCT_CATEGORY.every((cat) => value.includes(cat)); // 全部チェックされてたらtrue
          const someChecked = PRODUCT_CATEGORY.some((cat) => value.includes(cat)); // 1つ以上チェックされてたらtrue
          const isIndeterminate = someChecked && !allChecked; // チェックボックスが「ー」になる
          const isOtherChecked = value.includes('その他'); // その他が選択されているかどうか

          return (
            <FormItem>
              <RequiredLabel>製品カテゴリ</RequiredLabel>
              {/* すべて選択 */}
              <div className="mb-2 flex items-center">
                <Checkbox
                  id="select-all-category"
                  checked={allChecked}
                  indeterminate={isIndeterminate}
                  onCheckedChange={(checked) => {
                    const newValue = checked ? PRODUCT_CATEGORY : [];
                    field.onChange(newValue);
                    onChangeField({ productCategory: newValue });
                  }}
                />
                <label htmlFor="select-all-category" className="ml-2 text-sm">
                  すべて選択
                </label>
              </div>
              {/* 個別カテゴリ */}
              <div className="ml-6 flex flex-wrap gap-4">
                {PRODUCT_CATEGORY.filter((cat) => cat !== 'その他').map((cat) => (
                  <div key={cat} className="mb-1 flex items-center">
                    <Checkbox
                      id={`category-${cat}`}
                      checked={value.includes(cat)}
                      onCheckedChange={(checked) => {
                        let newValue = value || [];
                        if (checked) {
                          newValue = [...newValue, cat];
                        } else {
                          newValue = newValue.filter((v) => v !== cat);
                        }
                        field.onChange(newValue);
                        onChangeField({ productCategory: newValue });
                      }}
                    />
                    <label htmlFor={`category-${cat}`} className="ml-2 text-sm">
                      {cat}
                    </label>
                  </div>
                ))}
                {/* 「その他」チェックボックス＋入力欄 */}
                <div className="mb-1 flex items-center">
                  <Checkbox
                    id="category-その他"
                    checked={isOtherChecked}
                    onCheckedChange={(checked) => {
                      let newValue = value || [];
                      if (checked) {
                        newValue = [...newValue, 'その他'];
                      } else {
                        newValue = newValue.filter((v) => v !== 'その他');
                      }
                      field.onChange(newValue);
                      onChangeField({ productCategory: newValue });

                      // ON時に入力欄にフォーカス
                      if (checked && otherInputRef.current) {
                        setTimeout(() => otherInputRef.current?.focus(), 0);
                      }
                    }}
                  />
                  <label htmlFor="category-その他" className="ml-2 text-sm">
                    その他
                  </label>
                  <Input
                    ref={otherInputRef}
                    className="ml-2 w-80 min-w-48 max-w-full resize-x"
                    value={otherCategory}
                    onChange={(e) => {
                      setOtherCategory(e.target.value);
                      onChangeField({ productCategoryOther: e.target.value });
                    }}
                    disabled={!isOtherChecked}
                    placeholder="その他の内容を入力"
                  />
                </div>
              </div>
            </FormItem>
          );
        }}
      />

      {/* 具体的な機能や特徴 */}
      <FormField
        control={control}
        name="features"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>具体的な機能や特徴</RequiredLabel>
            <Textarea
              {...field}
              id="features"
              placeholder="例：CRM連携、自動ドラフト生成、成功パターン学習"
              className="min-h-[38px] resize-y"
              onKeyUp={(e) => {
                onChangeField({ features: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />

      {/* 主な用途 */}
      <FormField
        control={control}
        name="useCase"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>主な用途</RequiredLabel>
            <Textarea
              {...field}
              id="useCase"
              placeholder="例：商談フォローの次回アクションメール作成、提案書・見積提示前の提案骨子ドラフト作成"
              className="min-h-[38px] resize-y"
              onKeyUp={(e) => {
                onChangeField({ useCase: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
