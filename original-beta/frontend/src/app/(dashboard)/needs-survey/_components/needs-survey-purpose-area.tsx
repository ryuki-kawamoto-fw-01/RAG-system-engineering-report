import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNeedsSurvey } from '@/app/_store/slice/needs-survey';
import { Textarea } from '../../../_components/ui/textarea';
import { NeedsSurveySchema } from '../_utils/schema';

export default function NeedsSurveyPurposeArea() {
  const { onChangeField, control } = useFormReduxContext<NeedsSurveySchema>({
    setRedux: setNeedsSurvey,
  });
  return (
    <div>
      <FormField
        control={control}
        name="purpose"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>調査の目的</RequiredLabel>
            <Textarea
              {...field}
              id="purpose"
              placeholder="新規導入企業の獲得、満足度向上"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ purpose: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
