import FileDropAreaWithTempStorage from '@/app/_components/file-drop-area-with-temp-storage';
import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setKeyPointExtraction } from '@/app/_store/slice/key-point-extraction';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../_components/ui/tabs';
import { Textarea } from '../../../_components/ui/textarea';
import { ALLOWED_FILE_TYPES, KeyPointExtractionSchema } from '../_utils/schema';

export type SelectTab = 'direct-input' | 'file-upload';
interface Props {
  onTabClick: (v: SelectTab) => void;
}

export default function TextInputArea({ onTabClick }: Props): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<KeyPointExtractionSchema>({
    setRedux: setKeyPointExtraction,
  });

  return (
    <FormItem>
      <RequiredLabel>要点抽出したい文章</RequiredLabel>
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
            setRedux={setKeyPointExtraction}
            accept={ALLOWED_FILE_TYPES}
            uploadPrefix="temp/key-point-extraction"
          />
        </TabsContent>
      </Tabs>
    </FormItem>
  );
}
