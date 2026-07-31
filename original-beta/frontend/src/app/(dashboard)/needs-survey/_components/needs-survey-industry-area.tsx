import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNeedsSurvey } from '@/app/_store/slice/needs-survey';
import { Textarea } from '../../../_components/ui/textarea';
import { NeedsSurveySchema } from '../_utils/schema';

export default function NeedsSurveyIndustryArea() {
  const { onChangeField, control } = useFormReduxContext<NeedsSurveySchema>({
    setRedux: setNeedsSurvey,
  });
  return (
    <div>
      <FormField
        control={control}
        name="industry"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>業界・市場の種類</RequiredLabel>
            <Textarea
              {...field}
              id="industry"
              placeholder="製造業、工場向け業務効率化ソリューション市場"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ industry: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
