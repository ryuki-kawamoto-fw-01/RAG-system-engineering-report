{
  /* メール作成設定エリア */
}
import { zodResolver } from '@hookform/resolvers/zod';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectCreateMail } from '@/app/_store/selectors/create-mail';
import { setResult, setId } from '@/app/_store/slice/create-mail';
import { getMessage } from '@/app/_utils/message';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../_components/ui/tabs';
import { createNewMail, createReplyMail } from '../_actions/createMail';
import {
  createNewMailSchema,
  CreateNewMailSchema,
  CreateReplyMailSchema,
  createReplyMailSchema,
} from '../_utils/schema';
import { ButtonArea } from './button-area';
import { NewMailArea } from './new-mail-area';
import { ReplyMailArea } from './reply-mail-area';

// CreateMailFormProps型の定義
export type CreateMailFormProps = {
  setActiveTab: (value: string) => void;
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function CreateMailForm({
  setActiveTab,
  switchLayout,
  className,
}: CreateMailFormProps) {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdSubject, createdContent, modify, ...defaultValues } =
    useAppSelector(selectCreateMail);

  const form = useFormRedux<CreateNewMailSchema>({
    resolver: zodResolver(createNewMailSchema),
    values: {
      ...Object.fromEntries(
        Object.entries(defaultValues).filter(([key]) => {
          return Object.keys(createNewMailSchema.shape).includes(key);
        })
      ),
    } as CreateNewMailSchema,
  });
  const replyForm = useFormRedux<CreateReplyMailSchema>({
    resolver: zodResolver(createReplyMailSchema),
    defaultValues: {
      activeTab: 'direct-input',
    },
    values: {
      ...Object.fromEntries(
        Object.entries(defaultValues).filter(([key]) => {
          return Object.keys(createReplyMailSchema._def.schema.shape).includes(key);
        })
      ),
    } as unknown as CreateReplyMailSchema,
  });

  // 作成ボタンを押下時の処理
  const handleCreateNewMail = async (e: CreateNewMailSchema) => {
    try {
      const formData = new FormData();
      formData.append('newMailTo', e.newMailTo);
      formData.append('newMailFrom', e.newMailFrom);
      formData.append('newMailPurpose', e.newMailPurpose);
      formData.append('newMailContent', e.newMailContent);
      formData.append('newMailConsiderations', e.newMailConsiderations!);
      const id = uniqueId();

      const response = await createNewMail(id, formData);

      // 成功時の処理
      if (response.success) {
        dispatch(setId(id));
        dispatch(
          setResult({
            createdSubject: response.subject,
            createdContent: response.content,
            feedbackAt: undefined,
          })
        );
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
      }
    } catch (error) {
      console.error('Error creating mail:', error);
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };
  const handleCreateReplyMail = async (e: CreateReplyMailSchema) => {
    try {
      const formData = new FormData();
      formData.append('replyMailTo', e.replyMailTo);
      formData.append('replyMailFrom', e.replyMailFrom);
      formData.append('replyMailPurpose', e.replyMailPurpose);
      if (e.activeTab === 'file-upload') {
        if (e.receivedMailFiles && e.receivedMailFiles.length > 0) {
          // FileReferenceの配列をJSON文字列として送信
          formData.append('receivedMailFiles', JSON.stringify(e.receivedMailFiles));
        }
        // ファイルアップロードの場合は空文字列を送信
        formData.append('receivedMailText', '');
      } else {
        formData.append('receivedMailText', e.receivedMailText!);
      }
      formData.append('replyMailContent', e.replyMailContent);
      formData.append('replyMailConsiderations', e.replyMailConsiderations || '');
      formData.append('activeTab', e.activeTab);

      const id = uniqueId();

      const response = await createReplyMail(id, formData);

      // 成功時の処理
      if (response.success) {
        dispatch(setId(id));
        dispatch(
          setResult({
            createdSubject: '返信メール作成時は「件名」は表示されません。',
            createdContent: response.content,
            feedbackAt: undefined,
          })
        );
        toast.success('返信メールが作成されました。');
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
      }
    } catch (error) {
      console.error('Error creating mail:', error);
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };
  return (
    <Tabs defaultValue="new" onValueChange={setActiveTab} className={className}>
      <TabsList variant="underline">
        <TabsTrigger variant="underline" value="new">
          新規
        </TabsTrigger>
        <TabsTrigger variant="underline" value="reply">
          返信
        </TabsTrigger>
      </TabsList>

      {/* 新規メール作成エリア */}
      <TabsContent value="new" className="mt-2 h-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateNewMail)} className="flex h-full flex-col">
            <NewMailArea className="h-full flex-1 overflow-y-auto" />
            <ButtonArea />
          </form>
        </Form>
      </TabsContent>

      {/* 返信メール作成エリア */}
      <TabsContent value="reply" className="mt-2 h-full">
        <Form {...replyForm}>
          <form
            onSubmit={replyForm.handleSubmit(handleCreateReplyMail)}
            className="flex h-full flex-col"
          >
            <ReplyMailArea className="h-full flex-1 overflow-y-auto" />
            <ButtonArea />
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
