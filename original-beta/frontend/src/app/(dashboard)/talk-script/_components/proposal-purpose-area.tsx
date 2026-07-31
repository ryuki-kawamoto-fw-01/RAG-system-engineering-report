// 提案書目的エリア
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTalkScript } from '@/app/_store/slice/talk-script';
import { Textarea } from '../../../_components/ui/textarea';
import { TalkScriptSchema } from '../_utils/schema';

export default function ProposalPurposeArea() {
  const { onChangeField, control } = useFormReduxContext<TalkScriptSchema>({
    setRedux: setTalkScript,
  });

  return (
    <FormField
      control={control}
      name="purpose"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>提案書の目的</RequiredLabel>
          <Textarea
            {...field}
            onKeyUp={(e) => {
              onChangeField({ purpose: (e.target as HTMLTextAreaElement).value });
            }}
            id="purpose"
            placeholder="例：新規のお客様に対して、新システムを導入していただくことを目的としています。"
            className="min-h-[150px]"
          />
        </FormItem>
      )}
    />
  );
}
