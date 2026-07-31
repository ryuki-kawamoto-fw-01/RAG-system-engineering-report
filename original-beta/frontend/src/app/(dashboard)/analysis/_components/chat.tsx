'use client';

import { type Message, useChat as originalUseChat } from 'ai/react';
import { FormEvent, useEffect, useRef, useState, ClipboardEvent, useCallback } from 'react';
import { toast } from 'sonner';
import ChatBox from '@/app/_components/chat/chat-box';
import ChatMessageList from '@/app/_components/chat/chat-message-list';

import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setChatMessages as setChatMessagesSlice } from '@/app/_store/slice/analysis';
import { CHAT_API_ERROR_MSG } from '../../../../../config';
import { FileList } from '../../chat/[id]/_components/chat-utils';
import { AnalysisMessage, sendAnalysisChat } from '../_action/sendAnalysis';
import { convertFileToBase64, useFileHandling } from '../_utils/upload';
import AnalysisTitle from './title';

const useCustomChat = (options: { initialMessages: AnalysisMessage[] }) => {
  return originalUseChat({
    ...options,
    initialMessages: options.initialMessages as Message[],
  });
};

export default function ChatThread() {
  const dispatch = useAppDispatch();
  const { chatMessages } = useAppSelector((state) => state.analysis);
  const setChatMessages = useCallback(
    (messages: AnalysisMessage[]) => dispatch(setChatMessagesSlice(messages)),
    [dispatch]
  );
  const { input, handleInputChange, setInput } = useCustomChat({
    initialMessages: chatMessages,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const createNewMessage = async (input: string, files: FileList) => {
      let fileContent: string | undefined = undefined;

      if (files.length > 0) {
        try {
          fileContent = await convertFileToBase64(files[0]);
        } catch (error) {
          console.error('Error converting file to Base64:', error);
        }
      }
      return {
        role: 'user',
        content: input,
        file_name: files.length > 0 ? files[0].file.name : undefined,
        file_content: fileContent,
        createdAt: new Date(),
      };
    };

    const newMessage = await createNewMessage(input, files);
    setChatMessages([...chatMessages, newMessage as AnalysisMessage]);
    setInput('');
    setFileNamedrag(null);
    removeFile();

    const response = await sendAnalysisChat({
      messages: [...chatMessages, newMessage as AnalysisMessage],
    });

    if (!response || !response.success) {
      toast.error(CHAT_API_ERROR_MSG);
      setIsSubmitting(false);
      return;
    }

    setChatMessages([
      ...chatMessages,
      newMessage as AnalysisMessage,
      ...response.messages.messages.map((message) => ({ ...message, createdAt: new Date() })),
    ]);
    setFiles([]);
    setIsSubmitting(false);
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = event.clipboardData.files;
    if (files.length === 0) {
      return;
    }

    handleFileUpload(Array.from(files));
  };

  const isTextValid = () => {
    return /[^\s]/.test(input);
  };

  return (
    <div className="flex size-full flex-col" {...getRootProps()}>
      <AnalysisTitle />
      <ChatMessageList
        messages={chatMessages}
        isLoading={isSubmitting}
        feedbackEnabled={false}
        className="mx-auto w-full grow"
      />
      <div className="flex justify-center pt-9">
        <form className="w-full max-w-[720px]" onSubmit={handleSend}>
          <div className="relative">
            <div className="flex flex-col">
              <ChatBox
                value={input}
                isLoading={isSubmitting}
                placeholder={`メッセージを入力してください。ファイルをドラッグして添付可能です。\n例：○○.csvを分析し、年代ごとの人数を集計してください。`}
                isDisabled={!isTextValid() || fileUploading}
                files={files}
                handleFileClick={open}
                handleFileDelete={removeFile}
                attachmentTooltip={`ファイル添付\n対応ファイル：.csv .xlsx\n（最大1ファイル/最大40MB/暗号化ファイル不可）`}
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
          <p>最大1ファイル、各40MBまで</p>
        </div>
      ) : null}
    </div>
  );
}
