// 返信メール作成エリア
import { useEffect, useRef } from 'react';

import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateMail } from '@/app/_store/slice/create-mail';
import { cn } from '@/app/_utils/tw-merge';
import { Input } from '../../../_components/ui/input';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateReplyMailSchema } from '../_utils/schema';
import { FileUploadArea } from './file-upload-area';

type Props = {
  className?: string;
};

export function ReplyMailArea({ className }: Props) {
  const {
    onChangeField,
    control,
    formState: { isValid },
  } = useFormReduxContext<CreateReplyMailSchema>({
    setRedux: setCreateMail,
  });
  const ref = useRef<boolean>(false);
  useEffect(() => {
    ref.current = isValid;
  }, [isValid, ref]);
  return (
    <div className={cn('space-y-3 pb-[60px]', className)}>
      {/* 受信したメール */}
      <FileUploadArea />
      {/* 宛先 */}
      <FormField
        control={control}
        name="replyMailTo"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>宛先</RequiredLabel>
            <Input
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField({ replyMailTo: e.target.value });
              }}
              id="reply-to"
              placeholder="例：株式会社○○ ××様"
            />
          </FormItem>
        )}
      />
      {/* 差出人 */}
      <FormField
        control={control}
        name="replyMailFrom"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>差出人</RequiredLabel>
            <Input
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField({ replyMailFrom: e.target.value });
              }}
              id="reply-from"
              placeholder="例：株式会社□□ △△"
            />
          </FormItem>
        )}
      />
      {/* 目的 */}
      <FormField
        control={control}
        name="replyMailPurpose"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>返信の目的</RequiredLabel>
            <Input
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField({ replyMailPurpose: e.target.value });
              }}
              id="reply-purpose"
              placeholder="例：顧客への依頼、ベンダーへの調整"
            />
          </FormItem>
        )}
      />
      {/* 内容 */}
      <FormField
        control={control}
        name="replyMailContent"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>返信の内容</RequiredLabel>
            <Textarea
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField({ replyMailContent: e.target.value });
              }}
              id="reply-content"
              placeholder={`例：\n・受注を承諾して、今後の体制について打合せを調整したい\n・顧客に打合せの日程を回答を依頼したい\n・社内向けメール / 社外向けメール`}
              className="min-h-[150px]"
            />
          </FormItem>
        )}
      />
      {/* 考慮事項 */}
      <FormField
        control={control}
        name="replyMailConsiderations"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>考慮事項</OptionalLabel>
            <Textarea
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField({ replyMailConsiderations: e.target.value });
              }}
              placeholder="例：初回の顧客にとって、相応しい文言か確認してほしい"
              className="min-h-[150px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
