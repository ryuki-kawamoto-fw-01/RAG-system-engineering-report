import FileDropAreaWithTempStorage from '@/app/_components/file-drop-area-with-temp-storage';
import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTextCorrection } from '@/app/_store/slice/text-correction';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../_components/ui/tabs';
import { Textarea } from '../../../_components/ui/textarea';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, TextCorrectionSchema } from '../_utils/schema';

export type SelectTab = 'direct-input' | 'file-upload';
interface Props {
  onTabClick: (v: SelectTab) => void;
}

export default function TextInputArea({ onTabClick }: Props): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<TextCorrectionSchema>({
    setRedux: setTextCorrection,
  });

  return (
    <FormItem>
      <RequiredLabel>校正したい文章</RequiredLabel>
      <Tabs defaultValue="direct-input">
        <TabsList>
          <TabsTrigger value="direct-input" onClick={() => onTabClick('direct-input')}>
            テキスト入力
          </TabsTrigger>
          <TabsTrigger value="file-upload" onClick={() => onTabClick('file-upload')}>
            ファイルアップロード
          </TabsTrigger>
        </TabsList>
        <TabsContent value="direct-input">
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
                  className="min-h-[150px]"
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
            setRedux={setTextCorrection}
            accept={ALLOWED_FILE_TYPES}
            maxSize={MAX_FILE_SIZE}
            uploadPrefix="temp/text_correction"
          />
        </TabsContent>
      </Tabs>
    </FormItem>
  );
}
