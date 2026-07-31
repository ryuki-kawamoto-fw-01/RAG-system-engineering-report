// 受信したメール文エリア
import FileDropAreaWithTempStorage from '@/app/_components/file-drop-area-with-temp-storage';
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateMail } from '@/app/_store/slice/create-mail';
import { CreateReplyMailSchema } from '../_utils/schema';

export function FileUploadArea() {
  const { onChangeField, control, watch } = useFormReduxContext<CreateReplyMailSchema>({
    setRedux: setCreateMail,
  });
  const activeTab = watch('activeTab', '');

  return (
    <div>
      <RequiredLabel>受信したメール</RequiredLabel>
      <Tabs value={activeTab} onValueChange={(v) => onChangeField({ activeTab: v })}>
        <TabsList className="mt-1.5">
          <TabsTrigger value="direct-input">テキスト入力</TabsTrigger>
          <TabsTrigger value="file-upload">ファイルアップロード</TabsTrigger>
        </TabsList>
        {/* メール文を直接入力 */}
        <TabsContent value="direct-input">
          <FormField
            control={control}
            name="receivedMailText"
            render={({ field }) => (
              <FormItem>
                <Textarea
                  {...field}
                  onKeyUp={(e) => {
                    onChangeField({ receivedMailText: (e.target as HTMLTextAreaElement).value });
                  }}
                  className="min-h-[156px]"
                />
              </FormItem>
            )}
          />
        </TabsContent>
        {/* MSGファイルを添付 */}
        <TabsContent value="file-upload">
          <FileDropAreaWithTempStorage
            name="receivedMailFiles"
            setRedux={setCreateMail}
            accept={{ 'application/octet-stream': ['.msg'] }}
            maxSize={20 * 1024 * 1024}
            uploadPrefix="temp/create_mail"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
