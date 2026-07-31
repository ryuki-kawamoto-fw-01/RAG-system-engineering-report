import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNeedsSurvey } from '@/app/_store/slice/needs-survey';
import { Textarea } from '../../../_components/ui/textarea';
import { NeedsSurveySchema } from '../_utils/schema';

export default function NeedsSurveyPersonaArea() {
  const { onChangeField, control } = useFormReduxContext<NeedsSurveySchema>({
    setRedux: setNeedsSurvey,
  });
  return (
    <div>
      <FormField
        control={control}
        name="persona"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>顧客ペルソナ</RequiredLabel>
            <Textarea
              {...field}
              id="persona"
              placeholder="生産管理担当者、40代男性、現場経験が長く、ITにはやや不慣れ、生産性向上・人手不足の解消に関心あり"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ persona: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
