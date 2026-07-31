import { Controller, Control } from 'react-hook-form';
import { FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useAppDispatch } from '@/app/_store/hooks';
import { setCorporateSurvey } from '@/app/_store/slice/corporate-survey';
import { Textarea } from '../../../_components/ui/textarea';
import { CorporateSurvey } from '../_type';

type Props = {
  control: Control<CorporateSurvey>;
};

export default function AdditionalInformationArea({ control }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  return (
    <FormItem>
      <OptionalLabel>その他調査する情報</OptionalLabel>
      <Controller
        name="additionalConsideration"
        control={control}
        render={({ field }) => (
          <Textarea
            {...field}
            placeholder="例：社員数"
            className="min-h-[150px] w-full"
            onBlur={(e) => {
              field.onChange(e.target.value);
              dispatch(setCorporateSurvey({ additionalConsideration: e.target.value as string }));
            }}
          />
        )}
      />
    </FormItem>
  );
}
