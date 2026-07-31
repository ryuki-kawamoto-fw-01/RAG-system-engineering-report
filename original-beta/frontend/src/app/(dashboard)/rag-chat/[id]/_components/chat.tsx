'use client';

import { type Message, useChat } from 'ai/react';
import 'katex/dist/katex.min.css';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { deleteFile } from '@/app/_actions/deleteFile';
import { sendChat } from '@/app/_actions/sendChat';
import BanDialog from '@/app/_components/chat/ban-dialog';
import ChatBox from '@/app/_components/chat/chat-box';
import ChatMessageList from '@/app/_components/chat/chat-message-list';
import ChatTemplates from '@/app/_components/chat/chat-templates';
import PersonalDataDialog from '@/app/_components/chat/personal-data-dialog';
import TemplateSelectorButton from '@/app/_components/chat/template-selector-button';
import PageLayout from '@/app/_components/layout/page-layout';
import FileViewer from '@/app/_components/ui/file-viewer';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/app/_components/ui/resizable';
import { Spinner } from '@/app/_components/ui/spinner';
import TextLink from '@/app/_components/ui/text-link';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setRagSelectedModel, setRagSelectedSarchMethod } from '@/app/_store/slice/model';
import { PromptTemplate } from '@/app/_types/prompt-template';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { getMessage } from '@/app/_utils/message';
import CategorySelectorButton from './category-selector-button';
import ParameterSettingsButton from './parameter-settings-button';
import { useFileHandling } from './ragchat-utils';

type Props = {
  id: string;
  initialMessages?: Message[];
  threadId: string;
  templates: PromptTemplate[];
  banWords: { banWord: string }[];
};

type PiiItem = {
  category: string;
  text: string;
};

export default function ChatThread({ id, initialMessages, threadId, templates, banWords }: Props) {
  const { messages, input, handleInputChange, setInput } = useChat({
    id,
    initialMessages,
    body: {
      id,
    },
  });
  const router = useRouter();
  const { rag_selectedModel, rag_selectedSearchMethod } = useAppSelector((state) => state.model);
  const model = rag_selectedModel;
  const searchMethod = rag_selectedSearchMethod;
  const dispatch = useAppDispatch();
  const setModel = useCallback(
    (select: string) => {
      dispatch(setRagSelectedModel(select));
    },
    [dispatch]
  );
  const setSearchMethod = useCallback(
    (select: string) => {
      dispatch(setRagSelectedSarchMethod(select));
    },
    [dispatch]
  );

  const [chatMessages, setChatMessages] = useState<Message[]>(messages);
  const [allMessages, setAllMessages] = useState<Message[]>(messages);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubContentOpen, setIsSubContentOpen] = useState(false);
  const [subContentWidth, setSubContentWidth] = useState(0);
  const [banDialogOpen, setBanDialogOpen] = useState<boolean>(false); // ダイアログの状態を追加
  const [foundBanWords, setFoundBanWords] = useState<string[]>([]); // 見つかった禁止ワードの状態を追加
  const [piiDialogOpen, setPiiDialogOpen] = useState<boolean>(false); // PIIダイアログの状態を追加
  const [piiList, setPiiList] = useState<PiiItem[]>([]); // PIIリストの状態を追加
  const [piiBoolChecked, setPiiBoolChecked] = useState<boolean>(false); // PIIチェックが完了したかどうかの状態を追加
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileTitle, setFileTitle] = useState<string>('');
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [recommend, setRecommend] = useState<string[] | undefined>([]); // おすすめの状態を追加
  const handleRecommendClick: (text: string) => void = (text) => {
    setInput(text);
    setPiiBoolChecked(true);
    handleSend(new Event('submit') as unknown as React.FormEvent, text, true);
  };
  const {
    fileUploading,
    files,
    setFiles,
    setFileNamedrag,
    getRootProps,
    getInputProps,
    isDragActive,
    open,
    removeFile,
    handleFileUpload,
  } = useFileHandling(input, setInput);

  const handleSettingsChange = (selectedModel: string, selectedSearchMethod: string) => {
    setModel(selectedModel);
    setSearchMethod(selectedSearchMethod);
  };

  const handleCategoryChange = (selectedCategory: string | null) => {
    setCategory(selectedCategory);
  };
  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  const checkBanWordsAndPii = async () => {
    // 禁止ワードが含まれているかチェック
    try {
      const foundBanWords = banWords
        .filter((banWord) => input.includes(banWord.banWord))
        .map((banWord) => banWord.banWord);
      if (foundBanWords.length > 0) {
        setFoundBanWords(foundBanWords);
        setBanDialogOpen(true);
        return;
      }
    } catch (error) {
      toast.error(getMessage('E_F_00100'));
      console.error('Error checking ban words:', error);
      throw error; // エラーを再スローして外側のcatchで処理
    }

    // PIIチェック
    if (!piiBoolChecked) {
      try {
        const response = await fetch('/api/pii/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.piiBool) {
            setPiiList(result.piiList);
            setPiiDialogOpen(true);
            setIsSubmitting(false);
            setPiiBoolChecked(true); // PIIチェックが完了したことを示すフラグを設定
            return false;
          }
        } else {
          console.error('PII check failed with status:', response.status);
        }
      } catch (error) {
        console.error('Error during PII check:', error);
        setIsSubmitting(false);
        toast.error(getMessage('E_F_00090'));
        return false;
      }
    }

    return true;
  };
  async function fetchFile(title: string, filepath: string, previewPath: string) {
    try {
      setFileLoading(true);
      setFileTitle(title);
      if (title.startsWith('FAQ ID:')) {
        setFileUrl(filepath);
      } else {
        // API Router経由でファイルを取得
        const downloadApiUrl = `/api/get-file-content?filepath=${encodeURIComponent(filepath)}`;
        const previewApiUrl = `/api/get-preview-file-content?filepath=${encodeURIComponent(previewPath)}&is_split_file=true`;
        const fileResponse = await fetch(downloadApiUrl);
        const buffer = await fileResponse.arrayBuffer();
        setFileUrl(previewApiUrl);
        setDownloadUrl(downloadApiUrl);
        setFileSize(buffer.byteLength);
      }
      setFileLoading(false);
    } catch (error) {
      setFileTitle(title);
      console.error('Error fetching file:', error);
      setFileLoading(false);
    }
  }

  const handleSend = async (e: React.FormEvent, text?: string, skipValidation = false) => {
    e.preventDefault();

    if (!skipValidation) {
      const canProceed = await checkBanWordsAndPii();
      setIsSubmitting(false); // スケルトンの表示状態をリセット
      if (!canProceed) return;
    }

    setPiiBoolChecked(false); // PIIチェックが完了したことをリセット

    setIsSubmitting(true);

    setRecommend(undefined); // おすすめをリセット

    const messageContent = text ?? input;

    const newMessage: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: messageContent,
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setAllMessages((prev) => [...prev, newMessage]);
    setInput('');
    setFileNamedrag(null);
    removeFile();

    const response = await sendChat({
      mode: 'rag',
      id: threadId,
      templateId: templateId ?? undefined,
      messages: [...allMessages, newMessage],
      model,
      searchMethod,
      fileUrl: files.length > 0 ? files[0].url : undefined,
      mediaType: files.length > 0 ? files[0].type : undefined,
      fileName: files.length > 0 ? files[0].name : undefined,
      category: category ?? undefined,
    });

    if (response.success) {
      const assistantMessage = await response.data;
      const receivedFileText = assistantMessage.receivedFileText;
      if (receivedFileText) {
        setAllMessages((prev) => [
          ...prev,
          {
            id: `${Date.now() + 2}`,
            role: 'user',
            content: receivedFileText,
          },
        ]);
      }
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: assistantMessage.content,
          refAns: assistantMessage.refAns, // 引用元を追加
        },
      ]);
      setAllMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: assistantMessage.content,
          refAns: assistantMessage.refAns, // 引用元を追加
        },
      ]);
      setRecommend(assistantMessage.recommend);
      router.refresh();
    } else {
      toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
    }

    setIsSubmitting(false);
    for (const file of files) {
      deleteFile(file.name);
    }
    setFiles([]);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = event.clipboardData.files;
    if (files.length === 0) {
      return;
    }

    handleFileUpload(Array.from(files));
  };

  // テキストバリデーション
  // TODO: 追々フォームの値、送信中フラグ、エラー、バリデーションをライブラリに置き換えたい
  const isTextValid = () => {
    return /[^\s]/.test(input);
  };

  const handleTitleClick = async (title: string, filepath: string, previewPath: string) => {
    setIsSubContentOpen(true);
    setSubContentWidth(50);
    fetchFile(title, filepath, previewPath);
  };

  const handleTemplateClick = (text: string, id: string) => {
    setInput(text);
    setTemplateId(id);
  };

  return (
    <div className="flex size-full" {...getRootProps()}>
      <ResizablePanelGroup direction="horizontal" className="grow overflow-y-auto">
        <ResizablePanel defaultSize={100 - subContentWidth} className="grow overflow-y-auto">
          <PageLayout className="relative pb-1 pt-1.5">
            <div className="flex h-full flex-col transition-all duration-300 ease-in-out">
              <div className="mb-1.5 flex items-center">
                <Heading level={3} className="flex items-center gap-x-[2px]">
                  文書検索
                  <Help message="文書登録画面にて登録された文書を検索する画面です。" />
                </Heading>
                <ParameterSettingsButton onSettingsChange={handleSettingsChange} />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {chatMessages.length === 0 && (
                  <div className="mx-auto mt-10 flex w-full max-w-[720px] flex-col items-center justify-center gap-y-4">
                    <h2 className="text-center text-3xl font-bold">
                      プロンプトを選択して会話を始める
                    </h2>
                    <ChatTemplates templates={templates} handleTextUpdate={handleTemplateClick} />
                    <TemplateSelectorButton input={input} setInput={handleTemplateClick} />
                  </div>
                )}
                <ChatMessageList
                  source="rag"
                  messages={chatMessages}
                  isLoading={isSubmitting}
                  className="mx-auto w-full grow"
                  markdownComponents={{
                    a: ({ children, ...props }) => {
                      const [title, filepath, previewPath] = (props.title || '').split('|');
                      return (
                        <TextLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleTitleClick(title, filepath, previewPath);
                          }}
                          {...props}
                        >
                          {children}
                        </TextLink>
                      );
                    },
                  }}
                  recommend={recommend}
                  onRecommendClick={handleRecommendClick}
                />
              </div>
              <div className="mx-auto flex w-full max-w-[720px] shrink-0 flex-col justify-center pt-9">
                <div className="flex justify-end">
                  <CategorySelectorButton onCategoryChange={handleCategoryChange} />
                </div>
                <form onSubmit={handleSend}>
                  <ChatBox
                    value={input}
                    isLoading={isSubmitting}
                    placeholder={`メッセージを入力してください。ファイルをドラッグして添付可能です。\n例：〇〇の操作方法を教えてください。`}
                    isDisabled={!isTextValid() || fileUploading}
                    files={files}
                    handleFileClick={open}
                    handleFileDelete={removeFile}
                    onChange={handleInputChange}
                    onPaste={handlePaste}
                  />
                  <p className="text-center text-xs text-neutral-400">
                    回答を間違えることがあります。ご理解のうえご利用ください。
                  </p>
                  <input {...getInputProps()} />
                </form>
              </div>
            </div>
          </PageLayout>
          {isDragActive ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90">
              <p className="text-3xl font-bold">
                ここにファイルをドロップしてメッセージに添付できます。
              </p>
              <p>最大1ファイル、各20MBまで</p>
            </div>
          ) : null}
        </ResizablePanel>
        {isSubContentOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel>
              {fileLoading ? (
                <div className="flex size-full items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                <FileViewer
                  url={fileUrl}
                  downloadUrl={downloadUrl}
                  name={fileTitle}
                  size={fileSize}
                  onClose={() => setIsSubContentOpen(false)}
                />
              )}
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      <BanDialog
        isOpen={banDialogOpen}
        onClose={() => setBanDialogOpen(false)}
        banWords={foundBanWords}
      />
      <PersonalDataDialog
        isOpen={piiDialogOpen}
        onClose={() => {
          setPiiDialogOpen(false);
          setIsSubmitting(false); // スケルトンの表示状態をリセット
        }}
        piiList={piiList}
        onConfirm={async () => {
          setPiiDialogOpen(false);
          setPiiBoolChecked(true); // PIIチェックが完了したことを示すフラグを設定
          setIsSubmitting(true); // 送信中フラグを設定
          await handleSend(new Event('submit') as unknown as React.FormEvent); // 型キャストを使用してエラーを回避
        }}
      />
    </div>
  );
}
