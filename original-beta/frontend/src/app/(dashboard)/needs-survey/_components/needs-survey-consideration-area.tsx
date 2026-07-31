import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNeedsSurvey } from '@/app/_store/slice/needs-survey';
import { Textarea } from '../../../_components/ui/textarea';
import { NeedsSurveySchema } from '../_utils/schema';

export default function NeedsSurveyConsiderationArea() {
  const { onChangeField, control } = useFormReduxContext<NeedsSurveySchema>({
    setRedux: setNeedsSurvey,
  });
  return (
    <div>
      <FormField
        control={control}
        name="additionalConsiderations"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>考慮事項</OptionalLabel>
            <Textarea
              {...field}
              placeholder="例：初期費用は抑えたい、サポート体制が充実していること"
              onKeyUp={(e) => {
                onChangeField({
                  additionalConsiderations: (e.target as HTMLTextAreaElement).value,
                });
              }}
              className="min-h-[100px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
