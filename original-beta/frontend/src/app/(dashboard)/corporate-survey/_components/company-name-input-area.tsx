import { Control } from 'react-hook-form';
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useAppDispatch } from '@/app/_store/hooks';
import { setCorporateSurvey } from '@/app/_store/slice/corporate-survey';
import { Input } from '../../../_components/ui/input';
import { CorporateSurvey } from '../_type';

type Props = {
  control: Control<CorporateSurvey>;
};

export default function CompanyNameInputArea({ control }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  return (
    <FormField
      control={control}
      name="surveyCompany"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>企業名</RequiredLabel>
          <Input
            id="companyName"
            type="text"
            {...field}
            placeholder="例：〇〇株式会社"
            className="mt-2"
            inputSize="lg"
            onBlur={(e) => {
              field.onChange(e.target.value);
              dispatch(setCorporateSurvey({ surveyCompany: e.target.value }));
            }}
          />
        </FormItem>
      )}
    />
  );
}
