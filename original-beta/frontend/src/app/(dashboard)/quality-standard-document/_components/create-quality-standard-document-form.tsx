'use client';

import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem, FormControl, FormMessage } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setQualityStandardDocument } from '@/app/_store/slice/quality-standard-document';
import { cn } from '@/app/_utils/tw-merge';
import { QualityStandardDocumentSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function CreateQualityStandardDocumentForm({ className }: Props) {
  const {
    onChangeField,
    control,
    formState: { isValid, isSubmitting },
  } = useFormReduxContext<QualityStandardDocumentSchema>({
    setRedux: setQualityStandardDocument,
  });

  return (
    <div className={cn('flex h-full flex-col relative', className)}>
      <div className="h-full space-y-3 overflow-y-auto pb-[48px]">
        {/* 製品名 */}
        <FormField
          control={control}
          name="product_name"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>製品名</RequiredLabel>
              <FormControl>
                <Input
                  placeholder="製品名を入力してください（例：自動車用ブレーキパッド）"
                  {...field}
                  onKeyUp={(e) => {
                    onChangeField({ product_name: (e.target as HTMLInputElement).value });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 製造業種 */}
        <FormField
          control={control}
          name="manufacturing_type"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>製造業種</RequiredLabel>
              <FormControl>
                <Input
                  placeholder="製造業種を入力してください（例：自動車部品製造）"
                  {...field}
                  onKeyUp={(e) => {
                    onChangeField({ manufacturing_type: (e.target as HTMLInputElement).value });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 適用法規制 */}
        <FormField
          control={control}
          name="applicable_regulations"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>適用規制</RequiredLabel>
              <FormControl>
                <Textarea
                  placeholder="適用される規制を入力してください（カンマ区切りで複数入力可）&#10;例：JIS D 4411（自動車用ブレーキライニング及びブレーキパッド）, ECE R90（ブレーキライニング規則）"
                  className="min-h-[100px] resize-none"
                  value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    const arrayValue = value
                      .split(',')
                      .map((item) => item.trim())
                      .filter((item) => item);
                    field.onChange(arrayValue);
                    onChangeField({ applicable_regulations: arrayValue });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 製品仕様 */}
        <FormField
          control={control}
          name="product_specifications"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>製品仕様</RequiredLabel>
              <FormControl>
                <Textarea
                  placeholder="製品の詳細仕様を入力してください&#10;例：寸法：150mm×80mm×15mm、材質：セミメタリック、重量：200g±10g"
                  className="min-h-[100px] resize-none"
                  {...field}
                  onKeyUp={(e) => {
                    onChangeField({
                      product_specifications: (e.target as HTMLTextAreaElement).value,
                    });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 品質特性 */}
        <FormField
          control={control}
          name="quality_characteristics"
          render={({ field }) => (
            <FormItem>
              <OptionalLabel>品質特性</OptionalLabel>
              <FormControl>
                <Textarea
                  placeholder="品質特性を入力してください（カンマ区切りで複数入力可）&#10;例：摩擦係数, 耐熱性, 寸法精度, 騒音レベル"
                  className="min-h-[80px] resize-none"
                  value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    const arrayValue = value
                      .split(',')
                      .map((item) => item.trim())
                      .filter((item) => item);
                    field.onChange(arrayValue);
                    onChangeField({ quality_characteristics: arrayValue });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 許容要求事項 */}
        <FormField
          control={control}
          name="tolerance_requirements"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>許容要求事項</RequiredLabel>
              <FormControl>
                <Textarea
                  placeholder="許容要求事項を入力してください&#10;例：摩擦係数±5%、寸法公差±0.1mm"
                  className="min-h-[80px] resize-none"
                  {...field}
                  onKeyUp={(e) => {
                    onChangeField({
                      tolerance_requirements: (e.target as HTMLTextAreaElement).value,
                    });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 既存検査方法 */}
        <FormField
          control={control}
          name="existing_inspection_methods"
          render={({ field }) => (
            <FormItem>
              <OptionalLabel>既存検査方法</OptionalLabel>
              <FormControl>
                <Textarea
                  placeholder="既存の検査方法を入力してください（カンマ区切りで複数入力可）&#10;例：摩擦係数測定試験, 寸法測定"
                  className="min-h-[80px] resize-none"
                  value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    const arrayValue = value
                      .split(',')
                      .map((item) => item.trim())
                      .filter((item) => item);
                    field.onChange(arrayValue);
                    onChangeField({ existing_inspection_methods: arrayValue });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 追加考慮事項 */}
        <FormField
          control={control}
          name="additional_considerations"
          render={({ field }) => (
            <FormItem>
              <OptionalLabel>追加考慮事項</OptionalLabel>
              <FormControl>
                <Textarea
                  placeholder="その他の考慮すべき事項があれば入力してください&#10;例：コスト効率を考慮し、既存設備で実施可能な方法を優先"
                  className="min-h-[80px] resize-none"
                  {...field}
                  onKeyUp={(e) => {
                    onChangeField({
                      additional_considerations: (e.target as HTMLTextAreaElement).value,
                    });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 文書詳細レベル */}
        <FormField
          control={control}
          name="document_detail_level"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>文書詳細レベル</RequiredLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    onChangeField({
                      document_detail_level: value as 'summary' | 'standard' | 'detailed',
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="詳細レベルを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">概要</SelectItem>
                    <SelectItem value="standard">標準</SelectItem>
                    <SelectItem value="detailed">詳細</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
          variant="secondary"
          disabled={!isValid || isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-6 animate-spin" />
              作成中です
            </>
          ) : (
            '作成する'
          )}
        </Button>
      </div>
    </div>
  );
}
