import { FormField, FormItem } from '@/app/_components/ui/form';
import Help from '@/app/_components/ui/help';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTextCorrection } from '@/app/_store/slice/text-correction';
import { Checkbox } from '../../../_components/ui/checkbox';
import { Label } from '../../../_components/ui/label';
import { checkpointGroups, TextCorrectionSchema } from '../_utils/schema';

export default function CheckpointsArea(): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<TextCorrectionSchema>({
    setRedux: setTextCorrection,
  });

  return (
    <FormItem>
      <RequiredLabel>校正の観点</RequiredLabel>
      <FormField
        control={control}
        name="checkpoints"
        render={({ field }) => (
          <FormItem>
            {checkpointGroups.map((group) => (
              <div key={group.name}>
                <div className="flex h-[26px] items-center gap-x-2">
                  <Checkbox
                    size="sm"
                    checked={group.items.every((item) => (field.value ?? []).includes(item))}
                    onCheckedChange={(checked) => {
                      const newCheckpoints = checked
                        ? [
                            ...field.value!,
                            ...group.items.filter((item) => !field.value!.includes(item)),
                          ]
                        : field.value!.filter((item) => !group.items.includes(item));
                      onChangeField({ checkpoints: newCheckpoints });
                    }}
                  />
                  <div className="text-sm">{group.name}</div>
                </div>
                <div className="ml-5 flex flex-wrap gap-x-6">
                  {group.items.map((item) => (
                    <div key={item} className="flex h-[26px] items-center">
                      <Checkbox
                        {...field}
                        size="sm"
                        defaultChecked={true}
                        id={`checkpoint-${item}`}
                        checked={field.value?.includes(item)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? onChangeField({ checkpoints: [...field.value!, item] })
                            : onChangeField({
                                checkpoints: field.value?.filter((value: string) => value !== item),
                              });
                        }}
                        className="mr-2"
                      />
                      <Label htmlFor={`checkpoint-${item}`}>{item}</Label>
                      {item === '表記ゆれ' && (
                        <Help
                          message="文章に存在する語句の表記ゆれをチェックし、表記を統一します。辞書登録機能で「統一名称」に登録した表記に統一します。"
                          size="sm"
                          className="ml-1 size-5"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </FormItem>
        )}
      />
    </FormItem>
  );
}
