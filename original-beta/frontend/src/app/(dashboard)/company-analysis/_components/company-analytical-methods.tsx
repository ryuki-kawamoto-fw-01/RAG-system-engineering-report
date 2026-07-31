import { Checkbox } from '@/app/_components/ui/checkbox';
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCompanyAnalysis } from '@/app/_store/slice/company-analysis';
import { analysis } from '../_utils/schema';
import { CompanyAnalysisSchema } from '../_utils/schema';

export default function CompanyAnalyticalMethods(): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<CompanyAnalysisSchema>({
    setRedux: setCompanyAnalysis,
  });
  return (
    <FormField
      control={control}
      name="analytical_methods"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>分析手法</RequiredLabel>
          <div className="w-full max-w-sm">
            {analysis.map((item) => (
              <div key={item.id} className="flex items-center space-x-1 py-1">
                <Checkbox
                  {...field}
                  id={item.id}
                  size="sm"
                  checked={field.value?.includes(item.id)}
                  onCheckedChange={(checked) => {
                    const value = checked
                      ? [...field.value!, item.id]
                      : field.value?.filter((value: string) => value !== item.id);
                    onChangeField({ analytical_methods: value });
                  }}
                />
                <label
                  htmlFor={item.id}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {item.label}
                </label>
              </div>
            ))}
          </div>
        </FormItem>
      )}
    />
  );
}
