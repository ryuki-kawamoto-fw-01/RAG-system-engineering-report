'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useFileHandling } from '@/app/(dashboard)/source-code-creation/_components/source-code-utils';
import ChatBox from '@/app/_components/chat/chat-box';
import ChatMessageList from '@/app/_components/chat/chat-message-list';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import {
  Message,
  PastQA,
  setMessages as setMessagesSlice,
  setPastQA as setPastQASlice,
  setInputMessage as setInputMessageSlice,
  setReport as setReportSlice,
} from '@/app/_store/slice/source-code-creation';
import { getMessage } from '@/app/_utils/message';
import { fetchSourceCodeReport } from '../_actions/fetch-source-code-report';
import { LanguageSelect } from './source-code-select';

export function SourceCodeChat() {
  const dispatch = useAppDispatch();
  const selector = useAppSelector((state) => state.sourceCodeCreation);
  const { messages, inputMessage, pastQA } = selector;
  const setMessages = useCallback(
    (messages: Message[]) => dispatch(setMessagesSlice(messages)),
    [dispatch]
  );
  const setPastQA = useCallback((pastQA: PastQA[]) => dispatch(setPastQASlice(pastQA)), [dispatch]);
  const setInputMessage = useCallback(
    (inputMessage: string) => dispatch(setInputMessageSlice(inputMessage)),
    [dispatch]
  );
  const setReport = useCallback((report: string) => dispatch(setReportSlice(report)), [dispatch]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');

  const setInput: React.Dispatch<React.SetStateAction<string>> = (value) => {
    if (typeof value === 'function') {
      setInputMessage((value as (prev: string) => string)(inputMessage));
    } else {
      setInputMessage(value);
    }
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
  } = useFileHandling(inputMessage, setInput);

  const handleChatSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    // 入力チェック: メッセージが空、または開発言語が未選択の場合は何もしない
    if (!inputMessage.trim() || !selectedLanguage) return;
    const userMessage: Message = { role: 'user', content: inputMessage };
    const currentInput = inputMessage;

    // 送信前に入力をクリア
    setInputMessage('');
    setMessages([...messages, userMessage]);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('inputMessage', currentInput);
      formData.append('pastQA', JSON.stringify(pastQA));
      formData.append('languageSelect', selectedLanguage);
      if (files.length > 0) {
        const fileListData = [
          {
            name: files[0].name,
            type: files[0].type,
            size: files[0].file.size,
          },
        ];
        console.log('[DEBUG] Sending fileList:', fileListData);
        formData.append('fileList', JSON.stringify(fileListData));
      } else {
        console.log('[DEBUG] No files to send');
      }

      const data = await fetchSourceCodeReport(formData);
      if ('chat' in data) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.chat || 'ソースコードの作成に失敗しました。',
        };
        setMessages([...messages, userMessage, assistantMessage]);
        setReport(data.source_code);

        setPastQA([
          ...pastQA,
          { question: currentInput, chat: data.chat, source_code: data.source_code },
        ]);
      } else {
        const assistantMessage: Message = {
          role: 'assistant',
          content: 'ソースコードの作成に失敗しました。' + data.message,
        };
        setMessages([...messages, userMessage, assistantMessage]);
        toast.error(getMessage('E_F_00110', 'ソースコード'));
      }
    } catch (error) {
      console.error('Error in handleChatSubmit:', error);
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'ソースコードの作成に失敗しました。もう一度お試しください。',
      };
      setMessages([...messages, userMessage, assistantMessage]);
      toast.error(getMessage('E_F_00110', 'ソースコード'));
    } finally {
      setIsLoading(false);
      setFileNamedrag(null);
      removeFile();
      setFiles([]);
    }
  };

  return (
    <div className="flex size-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ChatMessageList
          messages={messages.map((m, i) => ({
            ...m,
            id: String(i),
          }))}
          isLoading={isLoading}
          className="mx-auto w-full"
        />
      </div>
      <div {...getRootProps()} className="relative flex shrink-0 justify-center pt-9">
        <form className="w-full max-w-[720px]" onSubmit={handleChatSubmit}>
          <div className="relative">
            <div className="flex flex-col">
              <div className="mb-2 flex justify-end">
                <LanguageSelect
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                />
              </div>
              <ChatBox
                value={inputMessage}
                isLoading={isLoading}
                placeholder="実行したい処理、または修正したいコードの入力やファイルを添付してください。"
                isDisabled={!inputMessage.trim() || fileUploading || !selectedLanguage}
                files={files}
                handleFileClick={open}
                handleFileDelete={removeFile}
                onChange={(e) => setInputMessage(e.target.value)}
                onPaste={(event) => {
                  const files = event.clipboardData.files;
                  if (files.length === 0) return;
                  handleFileUpload(Array.from(files));
                }}
              />
            </div>
            <input {...getInputProps()} />
          </div>
        </form>
        {isDragActive ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90">
            <p className="text-3xl font-bold">
              ここにファイルをドロップしてメッセージに添付できます。
            </p>
            <p>最大1ファイル、各20MBまで</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
