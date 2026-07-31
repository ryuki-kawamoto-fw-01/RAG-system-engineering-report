import { Controller } from 'react-hook-form';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/sales-forecast';
import { ANALYSIS_PRIORITIES } from '../_constant';
import { SalesForecastSchema } from '../_utils/schema';

export default function AnalysisPrioritiesFields() {
  const { control, onChangeField } = useFormReduxContext<SalesForecastSchema>({
    setRedux: add,
  });

  return (
    <FormItem>
      {/* 見出し */}
      <h2 className="mb-4 text-lg font-bold">分析重視ポイント</h2>
      <RequiredLabel>分析で重視するポイント</RequiredLabel>
      {/* 全選択チェックボックス */}
      <Controller
        name="analysisPriorities"
        control={control}
        render={({ field }) => {
          const allChecked = ANALYSIS_PRIORITIES.every((p) => field.value?.includes(p));
          const someChecked = ANALYSIS_PRIORITIES.some((p) => field.value?.includes(p));
          const isIndeterminate = someChecked && !allChecked;

          return (
            <div className="mb-2 flex items-center">
              <Checkbox
                id="select-all-priorities"
                checked={allChecked}
                indeterminate={isIndeterminate}
                onCheckedChange={(checked) => {
                  const newValue = checked ? ANALYSIS_PRIORITIES : [];
                  field.onChange(newValue);
                  onChangeField({ analysisPriorities: newValue });
                }}
              />
              <label htmlFor="select-all-priorities" className="ml-2 text-sm">
                すべて選択
              </label>
            </div>
          );
        }}
      />
      {/* 個別チェックボックス */}
      <div className="ml-6 flex flex-wrap gap-4">
        {ANALYSIS_PRIORITIES.map((priority) => (
          <Controller
            key={priority}
            name="analysisPriorities"
            control={control}
            render={({ field }) => (
              <div className="flex items-center">
                <Checkbox
                  id={`priority-${priority}`}
                  checked={field.value?.includes(priority)}
                  onCheckedChange={(checked) => {
                    let newValue = field.value || [];
                    if (checked) {
                      newValue = [...newValue, priority];
                    } else {
                      newValue = newValue.filter((v) => v !== priority);
                    }
                    field.onChange(newValue);
                    onChangeField({ analysisPriorities: newValue });
                  }}
                />
                <label htmlFor={`priority-${priority}`} className="ml-2 text-sm">
                  {priority}
                </label>
              </div>
            )}
          />
        ))}
      </div>
    </FormItem>
  );
}
