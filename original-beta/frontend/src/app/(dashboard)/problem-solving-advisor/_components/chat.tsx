'use client';

import { type Message, useChat } from 'ai/react';
import { useRouter } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';
import { createAnswer } from '@/app/(dashboard)/problem-solving-advisor/_actions/createAnswer';
import ChatBox from '@/app/_components/chat/chat-box';
import ChatMessageList from '@/app/_components/chat/chat-message-list';
import SvgSend from '@/app/_components/icon/button/Send';
import { Button } from '@/app/_components/ui/button';
import { convertLogicTreeToMermaid } from './logicTreeToMermaid';

type Props = {
  id: string;
  threadId: string;
  onResetCallback?: (resetFunction: () => void) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

export default function ChatThread({ id, threadId, onResetCallback, onSubmittingChange }: Props) {
  const { messages, input, handleInputChange, setInput } = useChat({
    id,
    body: { id },
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // チャット履歴の状態管理
  const [chatHistory, setChatHistory] = useState<Message[]>(messages);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // ボタン表示制御のための状態
  const [showSkipButton, setShowSkipButton] = useState<boolean>(false);
  // 遷移フラグ用の状態変数を追加
  const [shouldNavigateToSummary, setShouldNavigateToSummary] = useState<boolean>(false);

  const router = useRouter();
  // リセット機能を追加
  const resetChat = () => {
    setChatHistory([]);
    setInput('');
    setIsSubmitting(false);
    setShowSkipButton(false);
    setShouldNavigateToSummary(false);
    // セッションストレージをクリア
    sessionStorage.removeItem('summaryData');
    router.refresh();
  };

  // 親コンポーネントにリセット関数を渡す
  useEffect(() => {
    if (onResetCallback) {
      onResetCallback(resetChat);
    }
  }, [onResetCallback]);

  // isSubmitting の状態が変わったときに親コンポーネントに通知
  useEffect(() => {
    if (onSubmittingChange) {
      onSubmittingChange(isSubmitting);
    }
  }, [isSubmitting, onSubmittingChange]);

  // 遷移フラグを監視するuseEffectを追加
  useEffect(() => {
    if (shouldNavigateToSummary) {
      // フラグをリセット（念のため）
      setShouldNavigateToSummary(false);
      // まとめページへ遷移
      router.push('/problem-solving-advisor/summary');
    }
  }, [shouldNavigateToSummary, router]);

  // スクロール制御
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // messagesが変わったらchatHistoryも更新
  useEffect(() => {
    setChatHistory(messages);
  }, [messages]);

  // チャット履歴を監視してボタン表示を制御
  useEffect(() => {
    // ユーザーメッセージが1つ以上あればボタンを表示
    const userMessages = chatHistory.filter((msg) => msg.role === 'user');
    setShowSkipButton(userMessages.length > 0);
  }, [chatHistory]);

  // そのままアドバイスを出すボタンのハンドラー
  const handleSkipToAdvice = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // 最後のユーザーメッセージを取得
    const userMessages = chatHistory.filter((msg) => msg.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastUserMessage) {
      setIsSubmitting(false);
      return;
    }

    // スキップ指示を追加したメッセージを作成
    const skipMessage: Message = {
      id: `skip-${Date.now()}`,
      role: 'user',
      content: '【システム: 深掘りをスキップしてそのままアドバイスを出してください】',
    };

    // APIリクエスト用の履歴を作成
    const apiRequestHistory = [...chatHistory, skipMessage];

    // 処理中の状態を示す一時的なメッセージ
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: 'アドバイスを生成しています...',
    };

    // 画面に処理中の表示をレンダリング
    setChatHistory((prev) => [...prev, loadingMessage]);

    try {
      // APIリクエスト
      const response = await createAnswer({
        mode: 'chat',
        id: threadId,
        messages: apiRequestHistory,
        model: '',
      });

      if (response.success) {
        // Mermaid変換を事前に行う
        const mermaidDiagram = convertLogicTreeToMermaid(response.data.logicTree || '');

        // セッションストレージに保存
        sessionStorage.setItem(
          'summaryData',
          JSON.stringify({
            logicTree: response.data.logicTree || '内容を取得できませんでした',
            advice: response.data.advice || '内容を取得できませんでした',
            summary: response.data.summary || '内容を取得できませんでした',
            content: response.data.content || '',
            mermaidDiagram, // 事前変換したMermaidコードを追加
          })
        );

        // 修正: loadingメッセージを削除せず、直接遷移
        // setChatHistory((prev) => prev.filter((msg) => msg.id !== loadingMessage.id));

        // 修正: 即座に遷移フラグを設定（setTimeoutを使わない）
        setShouldNavigateToSummary(true);

        // 修正: ここでisSubmittingをfalseに戻さない
        return;
      }
    } catch (error) {
      console.error('アドバイス生成エラー:', error);
      // エラーが発生した場合のみ、エラーメッセージを表示
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'アドバイスの生成中にエラーが発生しました。もう一度お試しください。',
      };
      setChatHistory((prev) =>
        prev.filter((msg) => msg.id !== loadingMessage.id).concat(errorMessage)
      );
    }

    // エラー時または遷移しない場合のみisSubmittingをfalseに
    setIsSubmitting(false);
  };

  // テキスト検証関数を追加
  const isTextValid = () => {
    return /[^\s]/.test(input);
  };

  // メインのフォーム送信ハンドラー
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 空文字チェックを追加（バリデーション）
    if (!isTextValid()) {
      return;
    }
    setIsSubmitting(true);

    const userMessage: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: input,
    };

    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setInput('');

    // ユーザーメッセージの数をカウント（5件目かどうかを判断するため）
    const userMessageCount = updatedHistory.filter((msg) => msg.role === 'user').length;

    // 修正: 5回目の質問の場合は（>= 5に修正）、APIリクエスト前にアドバイス生成中メッセージを表示
    if (userMessageCount >= 6) {
      const advisingMessage: Message = {
        id: `advising-${Date.now()}`,
        role: 'assistant',
        content: 'アドバイスを生成しています...',
      };

      // アドバイス生成中メッセージを先に表示
      setChatHistory((prev) => [...prev, advisingMessage]);

      // メッセージが表示されるのを確実にするため少し待機
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const response = await createAnswer({
      mode: 'chat',
      id: threadId,
      messages: updatedHistory,
      model: '',
    });

    if (response.success) {
      // 5回目の質問後は強制的にまとめ画面に遷移
      if (userMessageCount >= 6 || response.data.isSummary) {
        // 既にアドバイス生成中メッセージを表示している場合は追加しない
        if (userMessageCount < 6 && !response.data.isSummary) {
          const advisingMessage: Message = {
            id: `advising-${Date.now()}`,
            role: 'assistant',
            content: 'アドバイスを生成しています...',
          };

          // アドバイス生成中メッセージを追加
          setChatHistory((prev) => [...prev, advisingMessage]);

          // メッセージが表示されるのを確実にするため少し待機
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Mermaid変換を事前に行う
        let mermaidDiagram = '';

        // isSummaryがtrueの場合のみロジックツリーがある
        if (response.data.isSummary) {
          mermaidDiagram = convertLogicTreeToMermaid(response.data.logicTree || '');
        } else {
          // 5回目の質問だが、サーバーからisSummaryがfalseで返ってきた場合
          // ここで追加のリクエストを送るか、仮のデータを用意する
          console.log('5回目の質問だがisSummaryがfalse。強制的にまとめ画面に遷移します。');
        }

        // セッションストレージに保存
        sessionStorage.setItem(
          'summaryData',
          JSON.stringify({
            logicTree: response.data.logicTree || '内容を取得できませんでした',
            advice: response.data.advice || '内容を取得できませんでした',
            summary: response.data.summary || '内容を取得できませんでした',
            content: response.data.content || '',
            mermaidDiagram, // 事前変換したMermaidコードを追加
          })
        );

        // 少し遅延を入れて、メッセージが表示されることを確認
        setTimeout(() => {
          setShouldNavigateToSummary(true);
        }, 500);

        return;
      }

      // 通常のメッセージの場合
      const assistantMessage: Message = {
        id: `${Date.now() + 1}`,
        role: 'assistant',
        content: response.data.content,
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
      router.refresh();
    } else {
      // エラー時の処理
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '回答の生成中にエラーが発生しました。もう一度お試しください。',
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    }

    // 通常の応答またはエラー時のみisSubmittingをfalseに
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto flex h-[calc(100vh-92px)] max-w-5xl flex-col overflow-y-auto p-4 pt-6">
      <ChatMessageList
        messages={chatHistory}
        isLoading={isSubmitting}
        className="mx-auto w-full grow"
      />
      <div ref={messagesEndRef} />
      <div className="flex justify-center pt-9">
        <form className="w-full max-w-[720px]" onSubmit={handleSend}>
          {/* そのままアドバイスを出すボタン - スタイル修正 */}
          {showSkipButton && (
            <div className="mb-2 flex justify-end">
              <div className="w-[190px]">
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={handleSkipToAdvice}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <div className="flex w-full items-center justify-center space-x-2">
                    <SvgSend className="size-4" />
                    <span>{isSubmitting ? '生成中...' : 'そのままアドバイスを出す'}</span>
                  </div>
                </Button>
              </div>
            </div>
          )}
          <div className="relative">
            <div className="flex flex-col">
              <ChatBox
                value={input}
                isLoading={isSubmitting}
                placeholder={`課題を入力してください。\n例：生成AIをどのように活用してよいか分からない。今年中に生成AIを活用する業務を決めたい。`}
                onChange={handleInputChange}
                isDisabled={!isTextValid()}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
