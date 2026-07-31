import FileDropAreaWithTempStorage from '@/app/_components/file-drop-area-with-temp-storage';
import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTroubleShooting } from '@/app/_store/slice/trouble-shooting';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../_components/ui/tabs';
import { Textarea } from '../../../_components/ui/textarea';
import { ALLOWED_FILE_TYPES, TroubleShootingSchema } from '../_utils/schema';

export type SelectTab = 'direct-input' | 'file-upload';
interface Props {
  onTabClick: (v: SelectTab) => void;
}

export default function ProductSpecificationForm({ onTabClick }: Props): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<TroubleShootingSchema>({
    setRedux: setTroubleShooting,
  });

  return (
    <FormItem>
      <RequiredLabel>製品の仕様</RequiredLabel>
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
            name="productSpecificationText"
            render={({ field }) => (
              <FormItem>
                <Textarea
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onChangeField({ productSpecificationText: e.target.value });
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
            name="productSpecificationFiles"
            setRedux={setTroubleShooting}
            accept={ALLOWED_FILE_TYPES}
            uploadPrefix="temp/trouble-shooting"
          />
        </TabsContent>
      </Tabs>
    </FormItem>
  );
}
