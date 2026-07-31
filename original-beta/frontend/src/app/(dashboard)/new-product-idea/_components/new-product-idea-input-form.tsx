import FileDropAreaWithTempStorage from '@/app/_components/file-drop-area-with-temp-storage';
import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNewProductIdea } from '@/app/_store/slice/new-product-idea';
import { ALLOWED_FILE_TYPES, NewProductIdeaSchema } from '../_utils/schema';

export type SelectTab = 'direct-input' | 'file-upload';
interface Props {
  onTabClick: (v: SelectTab) => void;
}

export default function NewProductIdeaInputForm({ onTabClick }: Props) {
  const { onChangeField, control } = useFormReduxContext<NewProductIdeaSchema>({
    setRedux: setNewProductIdea,
  });

  return (
    <div className="mb-3 grow space-y-2">
      <RequiredLabel>アイデア創出のインプット情報</RequiredLabel>
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
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </TabsContent>
        <TabsContent value="file-upload">
          <FileDropAreaWithTempStorage
            name="fileList"
            setRedux={setNewProductIdea}
            accept={ALLOWED_FILE_TYPES}
            uploadPrefix="temp/new_product_idea"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
