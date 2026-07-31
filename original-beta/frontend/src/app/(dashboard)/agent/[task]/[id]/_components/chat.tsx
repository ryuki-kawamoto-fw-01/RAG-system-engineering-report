'use client';

import { type Message, useChat } from 'ai/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useFileHandling } from '@/app/(dashboard)/chat/[id]/_components/chat-utils';
import { deleteFile } from '@/app/_actions/deleteFile';
import BanDialog from '@/app/_components/chat/ban-dialog';
import ChatBox from '@/app/_components/chat/chat-box';
import ChatMessageList from '@/app/_components/chat/chat-message-list';
import ChatTemplates from '@/app/_components/chat/chat-templates';
import FilePrefixSelectorButton from '@/app/_components/chat/file-prefix-selector-button';
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
import { Switch } from '@/app/_components/ui/switch';
import { PromptTemplate } from '@/app/_types/prompt-template';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { CHAT_API_ERROR_MSG } from '../../../../../../../config';
import { AgentStep, MessageContentSchema } from '../../_actions/schema';
import { updateAgentSteps } from '../../_actions/updateAgentSteps';
import { merge, planning, reflection, toolUse } from '../_actions/agent';
import { createMessage } from '../_actions/createMessage';
import { Status } from '../type';
import { AgentStepList } from './agentStepList';

type Props = {
  id: string;
  initialMessages?: Message[];
  threadId: string;
  templates: PromptTemplate[];
  banWords: { banWord: string }[];
  defaultAgentSteps?: AgentStep[];
  containerName: string;
};

type PiiItem = {
  category: string;
  text: string;
};

export default function ChatThread({
  id,
  initialMessages,
  threadId,
  templates,
  banWords,
  defaultAgentSteps,
  containerName,
}: Props) {
  const { messages, input, handleInputChange, setInput } = useChat({
    id,
    initialMessages,
    body: {
      id,
    },
  });
  const router = useRouter();

  const [chatMessages, setChatMessages] = useState<Message[]>(messages);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>(defaultAgentSteps ?? []);
  const [banDialogOpen, setBanDialogOpen] = useState<boolean>(false); // ダイアログの状態を追加
  const [foundBanWords, setFoundBanWords] = useState<string[]>([]); // 見つかった禁止ワードの状態を追加
  const [piiDialogOpen, setPiiDialogOpen] = useState<boolean>(false); // PIIダイアログの状態を追加
  const [piiList, setPiiList] = useState<PiiItem[]>([]); // PIIリストの状態を追加
  const [piiBoolChecked, setPiiBoolChecked] = useState<boolean>(false); // PIIチェックが完了したかどうかの状態を追加
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileTitle, setFileTitle] = useState<string>('');
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [isSubContentOpen, setIsSubContentOpen] = useState(false);
  const [model] = useState<string>('gpt-5.2');
  const [agentWaiting, setAgentWaiting] = useState(false);
  const agentWaitingRef = useRef(agentWaiting);
  const [toolUseCancelled, setToolUseCancelled] = useState(false);
  const toolUseCancelledRef = useRef(toolUseCancelled);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const isAutoModeRef = useRef(isAutoMode);
  const [subContentWidth, setSubContentWidth] = useState(40);
  const [filePrefix, setFilePrefix] = useState<string | null>(null);
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

  const params = useParams();
  const MAX_REFLECTION_COUNT = 3;

  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    agentWaitingRef.current = agentWaiting;
  }, [agentWaiting]);

  useEffect(() => {
    toolUseCancelledRef.current = toolUseCancelled;
  }, [toolUseCancelled]);

  useEffect(() => {
    isAutoModeRef.current = isAutoMode;
  }, [isAutoMode]);

  useEffect(() => {
    if (agentSteps.length > 0) {
      updateAgentSteps({ threadId, agentSteps });
    }
  }, [agentSteps, threadId]);

  // waitToolUseConfirm 関数を修正
  const waitToolUseConfirm = async () => {
    if (!isAutoModeRef.current) {
      setAgentWaiting(true);
      // 1秒待機
      await new Promise((resolve) => setTimeout(resolve, 1000));
      while (agentWaitingRef.current) {
        // 1秒待機
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

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
            setPiiBoolChecked(true); // PIIチェックが完了したことを示すフラグを設定
            return false;
          }
        } else {
          console.error('PII check failed with status:', response.status);
        }
      } catch (error) {
        console.error('Error during PII check:', error);
        return false;
      }
    }

    return true;
  };

  const setNextStepAndCompleteLastStep = (nextStep: AgentStep) => {
    setAgentSteps((prev) => {
      if (prev.length === 0) {
        return [nextStep];
      }
      const lastStep = prev[prev.length - 1];
      lastStep.status = Status.Complete;
      if (prev.length === 1) {
        return [lastStep, nextStep];
      }
      const updatedLastStep = { ...lastStep, status: Status.Complete };
      return [...prev.slice(0, -1), updatedLastStep, nextStep];
    });
  };
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const canProceed = await checkBanWordsAndPii();
    if (!canProceed) return;

    setPiiBoolChecked(false); // PIIチェックが完了したことをリセット

    setIsSubmitting(true);
    const messageParsed = MessageContentSchema.safeParse(input);
    setInput('');
    if (!messageParsed.success) {
      toast.error(messageParsed.error.format()._errors[0]);
      setIsSubmitting(false);
      return;
    }
    const content = messageParsed.data;
    const newMessage: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content,
    };

    setChatMessages((prev) => [...prev, newMessage]);
    createMessage({
      threadId,
      model,
      message: {
        id: `${Date.now() + 1}`,
        role: 'user',
        content: input,
      },
    });

    try {
      setNextStepAndCompleteLastStep({
        title: '検索方法を検討',
        desc: '検索手法の選択、検索クエリを生成しております。',
        status: Status.InProgress,
      });

      const planningResponse = await planning(
        input,
        files.map((data) => ({
          url: data.url,
          name: data.name,
          type: data.type,
        })),
        model,
        params.task as string,
        filePrefix ?? undefined
      );
      removeFile();
      setFileNamedrag(null);

      setNextStepAndCompleteLastStep({
        title: '文書検索',
        desc: planningResponse.desc,
        status: Status.InProgress,
      });

      // ツール呼び出しを確認
      await waitToolUseConfirm();
      if (toolUseCancelledRef.current) {
        setToolUseCancelled(false);
        setIsSubmitting(false);
        return;
      }
      let { messages, segments } = await toolUse(
        planningResponse.plan,
        planningResponse.messages,
        params.task as string,
        model,
        filePrefix ?? undefined
      );

      setNextStepAndCompleteLastStep({
        title: 'ファイルの絞り込みが完了',
        desc: '',
        status: Status.Complete,
        segments,
      });

      setNextStepAndCompleteLastStep({
        title: '再検索の必要性を判断',
        desc: '再検索の必要性を判断しています',
        status: Status.InProgress,
      });

      for (let i = 0; i < MAX_REFLECTION_COUNT; i++) {
        // ツールを再度呼び出すかどうかを判定する
        const reflectionResponse = await reflection(
          planningResponse.user_message_rev,
          messages,
          model,
          params.task as string
        );

        // ツールの呼び出しが不要となった場合、ループを終了
        if (reflectionResponse.complete) break;

        // ツール呼び出しを確認
        await waitToolUseConfirm();
        if (toolUseCancelled) {
          setToolUseCancelled(false);
          setIsSubmitting(false);
          return;
        }

        // ツールの呼び出しが必要な場合、再度ツールを呼び出す
        const res = await toolUse(
          reflectionResponse.tool_calls,
          reflectionResponse.messages,
          params.task as string,
          model,
          filePrefix ?? undefined
        );
        messages = res.messages;
        segments = res.segments;

        setNextStepAndCompleteLastStep({
          title: '再検索',
          desc: reflectionResponse.desc,
          status: Status.InProgress,
          segments,
        });
      }

      const mergeResponse = await merge(planningResponse.user_message_rev, messages, model);

      setNextStepAndCompleteLastStep({
        title: '最終回答の作成',
        desc: 'すべてのタスクが完了しました。',
        status: Status.Complete,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: mergeResponse.answer,
        },
      ]);

      createMessage({
        threadId,
        model,
        message: {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: mergeResponse.answer,
        },
      });

      setIsSubmitting(false);
      router.refresh();
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error during handleSend:', error);
      toast.error(CHAT_API_ERROR_MSG);
    }

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
  const isTextValid = () => {
    return MessageContentSchema.safeParse(input).success;
  };

  const handleTemplateClick = (text: string) => {
    setInput(text);
  };

  async function fetchFile(filepath: string) {
    const fileTitle = filepath.split('/').pop() || '';
    try {
      setFileLoading(true);
      const previewApiUrl = `/api/get-file-content?filepath=${encodeURIComponent(filepath)}&container_name=${encodeURIComponent(containerName)}`;
      const fileResponse = await fetch(previewApiUrl);
      const buffer = await fileResponse.arrayBuffer();
      setFileUrl(previewApiUrl);
      setFileSize(buffer.byteLength);
      setFileTitle(fileTitle);
    } catch (error) {
      setFileTitle(fileTitle);
      console.error('Error fetching file:', error);
    }
    setFileLoading(false);
  }

  const handleTitleClick = async (title: string, filepath: string) => {
    setIsSubContentOpen(true);
    setSubContentWidth(50);
    fetchFile(filepath);
  };

  const handleFilePrefixChange = (selectedFilePrefix: string | null) => {
    setFilePrefix(selectedFilePrefix);
  };

  return (
    <div className="flex size-full">
      <ResizablePanelGroup direction="horizontal" className="grow overflow-y-auto">
        <ResizablePanel defaultSize={100 - subContentWidth} className="grow overflow-y-auto">
          <PageLayout className="relative pb-1 pt-1.5">
            <div className="flex size-full grow flex-col" {...getRootProps()}>
              <div className="mb-1.5 flex items-center justify-between">
                <Heading level={3} className="flex items-center gap-x-[2px]">
                  規格検索
                  <Help message="AIエージェントを使って社内規格を検索します" />
                </Heading>
              </div>
              {chatMessages.length === 0 && (
                <div className="mx-auto mt-10 flex max-w-[720px] flex-col items-center justify-center gap-y-4">
                  <h2 className="text-center text-3xl font-bold">
                    プロンプトを選択して会話を始める
                  </h2>
                  <ChatTemplates templates={templates} handleTextUpdate={handleTemplateClick} />
                  <TemplateSelectorButton input={input} setInput={setInput} />
                </div>
              )}
              <ChatMessageList
                source="agent"
                messages={chatMessages}
                isLoading={isSubmitting}
                className="mx-auto w-full grow"
              />
              <div className="mx-auto flex w-full max-w-[720px] flex-col justify-center">
                <div className="flex justify-end">
                  <FilePrefixSelectorButton
                    onFilePrefixChange={handleFilePrefixChange}
                    containerName={containerName}
                  />
                </div>
                <form className="w-full max-w-[720px]" onSubmit={handleSend}>
                  <div className="relative">
                    <div className="flex flex-col">
                      <ChatBox
                        value={input}
                        isLoading={isSubmitting}
                        placeholder="メッセージを入力してください。ファイルをドラッグして添付可能です。"
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
          </PageLayout>
        </ResizablePanel>
        <>
          <ResizableHandle withHandle />
          <ResizablePanel>
            <div className="relative size-full">
              <div className="items-between relative flex size-full flex-col justify-between overflow-auto">
                <AgentStepList
                  steps={agentSteps}
                  handleTitleClick={handleTitleClick}
                  agentWaiting={agentWaiting}
                  onContinue={() => {
                    setAgentWaiting(false);
                  }}
                  onStop={() => {
                    setToolUseCancelled(true);
                    setAgentWaiting(false);
                    setAgentSteps((prev) => [...prev.slice(0, -1)]);
                  }}
                />
                <div className="flex items-center bg-white p-4">
                  <Switch
                    checked={!isAutoMode}
                    onCheckedChange={() => {
                      setIsAutoMode((prev) => !prev);
                    }}
                  />
                  <span className="ml-2 text-xs text-neutral-900">タスク毎に確認する</span>
                </div>
              </div>
              {isSubContentOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
                  {fileLoading ? (
                    <div className="flex size-full items-center justify-center">
                      <Spinner />
                    </div>
                  ) : (
                    <FileViewer
                      downloadUrl={fileUrl}
                      url={fileUrl}
                      name={fileTitle}
                      size={fileSize}
                      onClose={() => setIsSubContentOpen(false)}
                    />
                  )}
                </div>
              )}
            </div>
          </ResizablePanel>
        </>
      </ResizablePanelGroup>
    </div>
  );
}
