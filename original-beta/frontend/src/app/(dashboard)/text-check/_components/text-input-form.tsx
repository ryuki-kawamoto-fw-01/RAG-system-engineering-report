import FileDropAreaWithTempStorage from '@/app/_components/file-drop-area-with-temp-storage';
import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTextCheck } from '@/app/_store/slice/text-check';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../_components/ui/tabs';
import { Textarea } from '../../../_components/ui/textarea';
import { ALLOWED_FILE_TYPES, TextCheckSchema } from '../_utils/schema';

export type SelectTab = 'form-input' | 'file-upload';
interface Props {
  onTabClick: (v: SelectTab) => void;
}

export default function TextInputArea({ onTabClick }: Props): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<TextCheckSchema>({
    setRedux: setTextCheck,
  });

  return (
    <FormItem>
      <RequiredLabel>校正したい文章</RequiredLabel>
      <Tabs defaultValue="form-input">
        <TabsList>
          <TabsTrigger value="form-input" onClick={() => onTabClick('form-input')}>
            テキスト入力
          </TabsTrigger>
          <TabsTrigger value="file-upload" onClick={() => onTabClick('file-upload')}>
            ファイルアップロード
          </TabsTrigger>
        </TabsList>
        <TabsContent value="form-input">
          <FormField
            control={control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <Textarea
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onChangeField({ text: e.target.value });
                  }}
                  className="min-h-[200px]"
                  showCounter
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </TabsContent>
        <TabsContent value="file-upload">
          <FileDropAreaWithTempStorage
            name="fileList"
            setRedux={setTextCheck}
            accept={ALLOWED_FILE_TYPES}
            uploadPrefix="temp/text-check"
          />
        </TabsContent>
      </Tabs>
    </FormItem>
  );
}
