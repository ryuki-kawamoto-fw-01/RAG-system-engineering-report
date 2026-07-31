import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNeedsSurvey } from '@/app/_store/slice/needs-survey';
import { Textarea } from '../../../_components/ui/textarea';
import { NeedsSurveySchema } from '../_utils/schema';

export default function NeedsSurveyProductArea() {
  const { onChangeField, control } = useFormReduxContext<NeedsSurveySchema>({
    setRedux: setNeedsSurvey,
  });
  return (
    <div>
      <FormField
        control={control}
        name="product"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>商品・サービスの概要</RequiredLabel>
            <Textarea
              {...field}
              id="product"
              placeholder="IoTセンサーとクラウド連携による稼働状況の可視化ツール、紙帳票の電子化、導入が容易"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ product: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
