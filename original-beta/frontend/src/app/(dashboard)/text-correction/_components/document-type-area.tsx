import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTextCorrection } from '@/app/_store/slice/text-correction';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../_components/ui/select';
import { TextCorrectionSchema } from '../_utils/schema';

export default function DocumentTypeArea(): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<TextCorrectionSchema>({
    setRedux: setTextCorrection,
  });

  return (
    <FormItem>
      <RequiredLabel>文章の目的</RequiredLabel>

      <FormField
        control={control}
        name="documentType"
        render={({ field }) => (
          <FormItem>
            <Select
              {...field}
              onValueChange={(e) => {
                onChangeField({ documentType: e });
              }}
            >
              <SelectTrigger id="document-type" className="w-full">
                <SelectValue placeholder="文書の目的を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_email">顧客へのメール</SelectItem>
                <SelectItem value="customer_proposal">顧客への提案書</SelectItem>
                <SelectItem value="customer_brochure">顧客向けパンフレット</SelectItem>
                <SelectItem value="contract">契約書</SelectItem>
                <SelectItem value="presentation_material">発表資料</SelectItem>
                <SelectItem value="report">報告書</SelectItem>
                <SelectItem value="minutes">議事録</SelectItem>
                <SelectItem value="internal_email">社内向けメール</SelectItem>
                <SelectItem value="internal_document">社内向け資料</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </FormItem>
  );
}
