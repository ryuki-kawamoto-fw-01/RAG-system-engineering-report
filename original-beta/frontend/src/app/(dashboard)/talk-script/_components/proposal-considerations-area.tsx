import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTalkScript } from '@/app/_store/slice/talk-script';
import { Textarea } from '../../../_components/ui/textarea';
import { TalkScriptSchema } from '../_utils/schema';

export default function ProposalConsiderationsArea() {
  const { onChangeField, control } = useFormReduxContext<TalkScriptSchema>({
    setRedux: setTalkScript,
  });

  return (
    <FormField
      control={control}
      name="considerations"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>考慮事項</OptionalLabel>
          <Textarea
            {...field}
            onKeyUp={(e) =>
              onChangeField({ considerations: (e.target as HTMLTextAreaElement).value })
            }
            placeholder="例：提案相手が2人いる、5分以内のスクリプト"
            className="min-h-[150px]"
          />
        </FormItem>
      )}
    />
  );
}
