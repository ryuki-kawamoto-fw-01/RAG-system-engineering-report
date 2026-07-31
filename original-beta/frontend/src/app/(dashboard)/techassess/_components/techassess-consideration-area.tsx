import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { TechassessSchema } from '../_utills/schema';

export default function TechassessFormFields() {
  const { control } = useFormContext<TechassessSchema>();
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="field"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>対象とする製造分野</RequiredLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="例：自動車部品、半導体、食品加工"
                className="border-input" // バリデーションエラーを無視
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="region"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>地域や市場</RequiredLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="例：日本、アジア、グローバル"
                className="border-input"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="companySize"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>評価対象の企業規模</OptionalLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="例：大企業、中小企業、スタートアップ"
                className="border-input"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="industryIssues"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>現在の業界の課題や関心事</RequiredLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="例：人手不足、コスト削減、品質向上"
                className="border-input"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="granularity"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>分析の粒度</RequiredLabel>
            <FormControl>
              <Input {...field} placeholder="例：概要、詳細" className="border-input" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="purpose"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>使用目的</RequiredLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="例：内報告用、経営層向け、技術者向け"
                className="border-input"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
