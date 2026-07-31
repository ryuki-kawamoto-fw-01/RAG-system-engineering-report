import { useFormContext } from 'react-hook-form';

import { Checkbox } from '@/app/_components/ui/checkbox';
import { FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
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
import { cn } from '@/app/_utils/tw-merge';

import {
  QualityReportInput,
  QUALITY_ISSUES_OPTIONS,
  MANUFACTURING_TYPE_OPTIONS,
  EVALUATION_METRICS_OPTIONS,
  REPORT_DETAIL_LEVEL_OPTIONS,
} from '../_utils/schema';

interface Props {
  className?: string;
}

export default function QualityReportForm({ className }: Props): JSX.Element {
  const form = useFormContext<QualityReportInput>();
  const { control } = form;

  return (
    <div className={cn('relative flex flex-col h-full', className)}>
      <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
        {/* 企業名 */}
        <FormField
          control={control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>企業名</RequiredLabel>
              <FormControl>
                <Input {...field} placeholder="企業名を入力してください" />
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="製造業種を選択してください" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MANUFACTURING_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 現在のプロセス概要 */}
        <FormField
          control={control}
          name="current_process_overview"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>現在のプロセス概要</RequiredLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="現在の品質管理プロセスの概要をご記入ください（例：ISO9001に基づく品質管理システムを運用中）"
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 品質データ管理 */}
        <FormField
          control={control}
          name="quality_data_management"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>品質データ管理</RequiredLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="品質データの管理方法をご記入ください（例：ERPシステムで不良率、検査結果を一元管理）"
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 品質履歴データ */}
        <FormField
          control={control}
          name="quality_history_data"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>品質履歴データ</RequiredLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="過去の品質実績をご記入ください（例：過去12ヶ月の不良率0.8%、顧客クレーム月平均3件）"
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 品質課題 */}
        <FormField
          control={control}
          name="quality_issues"
          render={() => (
            <FormItem>
              <RequiredLabel>品質課題（複数選択可）</RequiredLabel>
              <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                {QUALITY_ISSUES_OPTIONS.map((item) => (
                  <FormField
                    key={item}
                    control={control}
                    name="quality_issues"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item}
                          className="flex flex-row items-center space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              size="sm"
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value ?? []), item])
                                  : field.onChange(field.value?.filter((value) => value !== item));
                              }}
                            />
                          </FormControl>
                          <div className="grid gap-1.5 leading-none">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {item}
                            </label>
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 評価指標 */}
        <FormField
          control={control}
          name="evaluation_metrics"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>評価指標</RequiredLabel>
              <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                {EVALUATION_METRICS_OPTIONS.map((metric) => (
                  <div key={metric} className="flex items-center space-x-2">
                    <Checkbox
                      id={`metric-${metric}`}
                      size="sm"
                      checked={field.value?.includes(metric) || false}
                      onCheckedChange={(checked) => {
                        const currentValue = field.value || [];
                        if (checked) {
                          field.onChange([...currentValue, metric]);
                        } else {
                          field.onChange(currentValue.filter((item) => item !== metric));
                        }
                      }}
                    />
                    <label
                      htmlFor={`metric-${metric}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {metric}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 分析期間 */}
        <FormField
          control={control}
          name="analysis_period"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>分析期間</RequiredLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="分析対象期間をご記入ください（例：2024年1月-12月）"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 改善目標 */}
        <FormField
          control={control}
          name="improvement_goals"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>改善目標</RequiredLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="達成したい改善目標をご記入ください（例：不良率を50%削減し、顧客満足度を向上させる）"
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* レポート詳細レベル */}
        <FormField
          control={control}
          name="report_detail_level"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>レポート詳細レベル</RequiredLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="レポートの詳細レベルを選択してください" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REPORT_DETAIL_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {...field}
                  placeholder="特別な要求事項や考慮すべき点があればご記入ください"
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
