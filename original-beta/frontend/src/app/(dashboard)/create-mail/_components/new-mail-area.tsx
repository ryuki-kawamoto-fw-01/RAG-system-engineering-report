// 新規メール作成エリア
import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateMail } from '@/app/_store/slice/create-mail';
import { cn } from '@/app/_utils/tw-merge';
import { Input } from '../../../_components/ui/input';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateNewMailSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export function NewMailArea({ className }: Props) {
  const { onChangeField, control } = useFormReduxContext<CreateNewMailSchema>({
    setRedux: setCreateMail,
  });
  return (
    <div className={cn('space-y-3 mb-[52px]', className)}>
      {/* 宛先 */}
      <FormField
        control={control}
        name="newMailTo"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>宛先</RequiredLabel>
            <Input
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField({ newMailTo: e.target.value });
              }}
              id="to"
              placeholder="例：株式会社○○ ××様"
            />
          </FormItem>
        )}
      />
      {/* 差出人 */}
      <FormField
        control={control}
        name="newMailFrom"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>差出人</RequiredLabel>
            <Input
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField({ newMailFrom: e.target.value });
              }}
              id="from"
              placeholder="例：株式会社□□ △△"
            />
          </FormItem>
        )}
      />
      {/* 目的 */}
      <FormField
        control={control}
        name="newMailPurpose"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>メールの目的</RequiredLabel>
            <Input
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField({ newMailPurpose: e.target.value });
              }}
              id="purpose"
              placeholder="例：顧客への依頼、ベンダーへの調整"
            />
          </FormItem>
        )}
      />
      {/* 内容 */}
      <FormField
        control={control}
        name="newMailContent"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>メールの内容</RequiredLabel>
            <Textarea
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField({ newMailContent: e.target.value });
              }}
              id="content"
              placeholder={`例：\n・受注を承諾して、今後の体制に関する打ち合わせを調整するメール\n・顧客に打ち合わせの日程回答を依頼する`}
              className="min-h-[150px]"
            />
          </FormItem>
        )}
      />
      {/* 考慮事項 */}
      <FormField
        control={control}
        name="newMailConsiderations"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>考慮事項</OptionalLabel>
            <Textarea
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField({ newMailConsiderations: e.target.value });
              }}
              placeholder="例：相手の回答がすぐに欲しい"
              className="min-h-[150px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
