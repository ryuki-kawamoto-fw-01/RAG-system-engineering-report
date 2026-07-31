'use client';

import { type Message, useChat } from 'ai/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { deleteFile } from '@/app/_actions/deleteFile';
import { sendChat } from '@/app/_actions/sendChat';
import ChatBox from '@/app/_components/chat/chat-box';
import ChatMessageList from '@/app/_components/chat/chat-message-list';
import PersonalDataDialog from '@/app/_components/chat/personal-data-dialog';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setChatSelectedModel } from '@/app/_store/slice/model';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { getMessage } from '@/app/_utils/message';
import BanDialog from '../../../../_components/chat/ban-dialog';
import ChatTemplates from '../../../../_components/chat/chat-templates';
import TemplateSelectorButton from '../../../../_components/chat/template-selector-button';
import { useFileHandling } from './chat-utils';
import ParameterSettingsButton from './parameter-settings-button';

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
  const { chat_selectedModel } = useAppSelector((state) => state.model);
  const model = chat_selectedModel;
  const dispatch = useAppDispatch();
  const setModel = useCallback(
    (select: string) => {
      dispatch(setChatSelectedModel(select));
    },
    [dispatch]
  );

  const [chatMessages, setChatMessages] = useState<Message[]>(messages);
  const [allMessages, setAllMessages] = useState<Message[]>(messages);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState<boolean>(false); // ダイアログの状態を追加
  const [foundBanWords, setFoundBanWords] = useState<string[]>([]); // 見つかった禁止ワードの状態を追加
  const [piiDialogOpen, setPiiDialogOpen] = useState<boolean>(false); // PIIダイアログの状態を追加
  const [piiList, setPiiList] = useState<PiiItem[]>([]); // PIIリストの状態を追加
  const [piiBoolChecked, setPiiBoolChecked] = useState<boolean>(false); // PIIチェックが完了したかどうかの状態を追加
  const [recommend, setRecommend] = useState<string[] | undefined>([]); // おすすめの状態を追加
  const handleRecommendClick = (text: string) => {
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

  const handleSettingsChange = (selectedModel: string) => {
    setModel(selectedModel);
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
            setIsSubmitting(true);
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

  const handleSend = async (e: React.FormEvent, text?: string, skipValidation = false) => {
    e.preventDefault();

    if (!skipValidation) {
      const canProceed = await checkBanWordsAndPii();
      if (!canProceed) {
        setIsSubmitting(false); // スケルトンの表示状態をリセット
        return;
      }
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
      mode: 'chat',
      id: threadId,
      templateId: templateId ?? undefined,
      messages: [...allMessages, newMessage],
      model,
      fileUrl: files.length > 0 ? files[0].url : undefined,
      mediaType: files.length > 0 ? files[0].type : undefined,
      fileName: files.length > 0 ? files[0].name : undefined,
    });

    if (response.success) {
      const assistantMessage = response.data;
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
          searchResults: assistantMessage.searchResults || [],
        },
      ]);
      setAllMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: assistantMessage.content,
          searchResults: assistantMessage.searchResults || [],
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

  const handleTemplateClick = (text: string, id: string) => {
    setInput(text);
    setPiiBoolChecked(false); // 新しい入力がある場合はPIIチェックをリセット
    setTemplateId(id);
  };

  return (
    <div className="flex size-full flex-col" {...getRootProps()}>
      <div className="mb-1.5 flex items-center justify-between">
        <Heading level={3} className="flex items-center gap-x-[2px]">
          チャット
          <Help message="生成AIとのチャットができる画面です。" />
        </Heading>
        <ParameterSettingsButton onSettingsChange={handleSettingsChange} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {chatMessages.length === 0 && (
          <div className="mx-auto mt-10 flex max-w-[720px] flex-col items-center justify-center gap-y-4">
            <h2 className="text-center text-3xl font-bold">プロンプトを選択して会話を始める</h2>
            <ChatTemplates templates={templates} handleTextUpdate={handleTemplateClick} />
            <TemplateSelectorButton input={input} setInput={handleTemplateClick} />
          </div>
        )}
        <ChatMessageList
          messages={chatMessages}
          isLoading={isSubmitting}
          className="mx-auto w-full"
          recommend={recommend}
          onRecommendClick={handleRecommendClick}
        />
      </div>
      <div className="flex shrink-0 justify-center pt-9">
        <form className="w-full max-w-[720px]" onSubmit={handleSend}>
          <div className="relative">
            <div className="flex flex-col">
              <ChatBox
                value={input}
                isLoading={isSubmitting}
                placeholder={`メッセージを入力してください。ファイルをドラッグして添付可能です。\n例：〇〇の××を初心者がわかるレベルで解説してください。`}
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
            </div>
            <input {...getInputProps()} />
          </div>
        </form>
      </div>
      {isDragActive ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90">
          <p className="text-3xl font-bold">
            ここにファイルをドロップしてメッセージに添付できます。
          </p>
          <p>最大1ファイル、各20MBまで</p>
        </div>
      ) : null}
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
          setIsSubmitting(true); // 送信中の状態を設定
          await handleSend(new Event('submit') as unknown as React.FormEvent); // 型キャストを使用してエラーを回避
        }}
      />
    </div>
  );
}
