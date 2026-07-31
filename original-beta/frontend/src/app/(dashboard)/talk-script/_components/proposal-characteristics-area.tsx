// 提案書特徴エリア
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTalkScript } from '@/app/_store/slice/talk-script';
import { Slider } from '../../../_components/ui/slider';
import { TalkScriptSchema } from '../_utils/schema';

export default function ProposalCharacteristicsArea() {
  const { onChangeField, control } = useFormReduxContext<TalkScriptSchema>({
    setRedux: setTalkScript,
  });
  return (
    <FormItem>
      <RequiredLabel>提案相手の特徴</RequiredLabel>
      <div className="space-y-1.5">
        <FormField
          control={control}
          name="partnerCharacteristics"
          render={({ field }) => (
            <FormItem>
              {[
                {
                  label: '専門性',
                  tooltip: '提案分野についてどれだけ専門的な知識を持っているか',
                },
                { label: '興味', tooltip: '提案内容にどれだけ興味を持っているか' },
                { label: '親密度', tooltip: 'どれだけ親密であるか' },
              ].map((item, index) => (
                <div key={item.label} className="space-y-1">
                  <span className="w-14 text-base">{item.label}</span>
                  <Slider
                    value={[field.value![index]]}
                    onValueChange={(value) => {
                      const newCharacteristics = field.value!.map((data: number, i: number) =>
                        index === i ? value[0] : data
                      );
                      onChangeField({ partnerCharacteristics: newCharacteristics });
                    }}
                    max={100}
                    step={1}
                    className="grow"
                  />
                </div>
              ))}
            </FormItem>
          )}
        />
      </div>
    </FormItem>
  );
}
