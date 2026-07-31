import { FormField, FormItem } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCompanyAnalysis } from '@/app/_store/slice/company-analysis';
import { CompanyAnalysisSchema } from '../_utils/schema';

export default function CompanyName(): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<CompanyAnalysisSchema>({
    setRedux: setCompanyAnalysis,
  });

  return (
    <FormField
      control={control}
      name="company_name"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>企業名</RequiredLabel>
          <Input
            {...field}
            placeholder="例：○○株式会社"
            onBlur={(e) => {
              onChangeField({ company_name: e.target.value });
            }}
          />
        </FormItem>
      )}
    />
  );
}
