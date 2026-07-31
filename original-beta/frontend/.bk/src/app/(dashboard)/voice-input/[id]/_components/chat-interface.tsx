'use client';

import { useState, useRef, useEffect } from 'react';
import { RTClient, RTResponse, RTInputAudioItem, AccessToken } from 'rt-client';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { AudioHandler } from '@/app/_lib/audio';
import rtClient from '@/app/_lib/rt-client';
import { useConfigStore } from '@/app/_lib/stores';
import { uniqueId } from '@/app/_utils/uniqueId';
import { updateChatThread } from '../../_actions/updateChatThread';
import { Message } from '../../_utils/schema';
import { createMessage } from '../_actions/createMessage';
import { getChatThreadForFeedback } from '../_actions/getChatThreadForFeedback';
import { isFirstUserMessage } from '../_actions/isFirstUserMessage';
import { updateMessage } from '../_actions/updateMessage';
import { ChatPanel } from './chat-panel';

interface ChatInterfaceProps {
  userId: string;
  threadId: string;
  initialMessages: Message[];
  accessToken?: AccessToken;
}

export default function ChatInterface({
  userId,
  threadId,
  initialMessages,
  accessToken,
}: ChatInterfaceProps) {
  // RTClient関連の状態
  const [isConnected, setIsConnected] = useState(false); // RTClient接続状態
  const clientRef = useRef<RTClient | null>(null);
  const audioHandlerRef = useRef<AudioHandler | null>(null);

  // チャット関連の状態
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isRecording, setIsRecording] = useState(false);

  const { isSessionExpired } = useConfigStore(
    useShallow((state) => ({
      isSessionExpired: state.isSessionExpired,
    }))
  );

  // セッションの有効期限切れを検知して録音を停止
  useEffect(() => {
    const handleSessionExpired = async () => {
      if (isSessionExpired && isRecording) {
        setIsRecording(false);
        await stopAndCleanupAudioHandler();
        await disconnectRtClient();
      }
    };

    handleSessionExpired();
  }, [isSessionExpired, isRecording]);

  // RTClientの接続処理 (ヘルパー関数)
  const connectRtClient = async () => {
    if (!isConnected && accessToken && !clientRef.current) {
      try {
        clientRef.current = rtClient({
          accessToken,
        });

        startResponseListener();
        setIsConnected(true);
      } catch (error) {
        console.error('RTClient connection failed:', error);
        await disconnectRtClient();
        throw error;
      }
    }
  };

  // RTClientの切断処理 (ヘルパー関数)
  const disconnectRtClient = async () => {
    if (clientRef.current) {
      try {
        await clientRef.current.close();
      } catch (error) {
        console.error('Failed to close RTClient:', error);
      } finally {
        clientRef.current = null;
        setIsConnected(false);
      }
    }
  };

  // 音声ハンドラの初期化 (ヘルパー関数)
  const initializeAudioHandler = async () => {
    if (!audioHandlerRef.current) {
      audioHandlerRef.current = new AudioHandler();
      try {
        await audioHandlerRef.current.initialize();
      } catch (error) {
        console.error('Failed to initialize AudioHandler:', error);
        audioHandlerRef.current = null;
        throw error;
      }
    }
  };

  // 音声ハンドラの停止とクリーンアップ (ヘルパー関数)
  const stopAndCleanupAudioHandler = async () => {
    if (audioHandlerRef.current) {
      try {
        try {
          audioHandlerRef.current.stopRecording();
        } catch (error) {
          console.error('Error stopping recording in cleanup:', error);
        }
        audioHandlerRef.current.stopStreamingPlayback();
        await audioHandlerRef.current.close();
      } catch (error) {
        console.error('Error closing AudioHandler:', error);
      } finally {
        audioHandlerRef.current = null;
      }
    }
  };

  // レスポンスリスナーの設定 (接続/切断と連動)
  const startResponseListener = async () => {
    if (!clientRef.current) return;
    try {
      for await (const serverEvent of clientRef.current.events()) {
        if (serverEvent.type === 'response') {
          await handleResponse(serverEvent);
        } else if (serverEvent.type === 'input_audio') {
          await handleInputAudio(serverEvent);
        }
      }
    } catch (error) {
      console.error('Response iteration error:', error);
    }
  };

  // レスポンス処理
  const handleResponse = async (response: RTResponse) => {
    for await (const item of response) {
      if (item.type === 'message' && item.role === 'assistant') {
        let message: Message = {
          id: item.id,
          threadId,
          userId,
          role: item.role,
          content: '',
          chatHistory: [],
          createdAt: new Date().getTime(),
        };
        setMessages((prev) => [...prev, message]);
        await createMessage(message);

        let fullContent = '';
        for await (const content of item) {
          if (content.type === 'text') {
            let isTextComplete = false;

            for await (const text of content.textChunks()) {
              fullContent += text;
              setMessages((prev) => {
                const updatedMessages = [...prev];
                const targetMessageIndex = updatedMessages.findIndex((m) => m.id === message.id);
                if (targetMessageIndex !== -1) {
                  updatedMessages[targetMessageIndex] = {
                    ...updatedMessages[targetMessageIndex],
                    content: fullContent,
                  };
                }
                return updatedMessages;
              });
              message.content = fullContent;
            }
            isTextComplete = true;

            if (isTextComplete) {
              try {
                message = {
                  ...message,
                  content: fullContent,
                };
                await updateMessage(message);
                await updateChatThread(message.threadId);
              } catch (error) {
                console.error('テキストメッセージの保存に失敗しました:', error);
              }
            }
          } else if (content.type === 'audio') {
            const textTask = async () => {
              for await (const text of content.transcriptChunks()) {
                fullContent += text;

                setMessages((prev) => {
                  const updatedMessages = [...prev];
                  const targetMessageIndex = updatedMessages.findIndex((m) => m.id === message.id);
                  if (targetMessageIndex !== -1) {
                    updatedMessages[targetMessageIndex] = {
                      ...updatedMessages[targetMessageIndex],
                      content: fullContent,
                    };
                  }
                  return updatedMessages;
                });

                message.content = fullContent;
              }

              try {
                message = {
                  ...message,
                  content: fullContent,
                };
                await updateMessage(message);
                await updateChatThread(message.threadId);
              } catch (error) {
                console.error('音声メッセージの保存に失敗しました:', error);
              }
            };

            const audioTask = async () => {
              audioHandlerRef.current?.startStreamingPlayback();
              for await (const audio of content.audioChunks()) {
                audioHandlerRef.current?.playChunk(audio);
              }
            };
            await Promise.all([textTask(), audioTask()]);
          }
        }

        try {
          message = {
            ...message,
            content: fullContent,
          };
          await updateMessage(message);
          await updateChatThread(message.threadId);
        } catch (error) {
          console.error('最終的なメッセージの保存に失敗しました:', error);
        }
      }
    }
  };

  // 音声入力処理
  const handleInputAudio = async (item: RTInputAudioItem) => {
    audioHandlerRef.current?.stopStreamingPlayback();
    await item.waitForCompletion();
    const newMessage: Message = {
      id: uniqueId(),
      threadId,
      userId,
      content: item.transcription || '`ユーザーの音声`',
      role: 'user',
      chatHistory: [],
      createdAt: new Date().getTime(),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    try {
      // スレッドの最初のユーザーメッセージかどうかを確認
      const isFirst = await isFirstUserMessage(newMessage.threadId);

      await createMessage(newMessage);

      if (isFirst) {
        const titleContent = newMessage.content || '';
        const title =
          titleContent.length > 10 ? titleContent.substring(0, 10) + '...' : titleContent;

        // スレッドのタイトルを更新
        await updateChatThread(newMessage.threadId, title);
      } else {
        await updateChatThread(newMessage.threadId);
      }
    } catch (error) {
      console.error('音声メッセージの保存に失敗しました:', error);
    }
  };

  // 音声録音の切り替え
  const handleToggleRecording = async () => {
    if (isSessionExpired) {
      return;
    }

    if (!isRecording) {
      // --- 録音開始 ---
      try {
        await connectRtClient();
        await initializeAudioHandler();

        setIsConnected(true);

        if (audioHandlerRef.current && clientRef.current) {
          await audioHandlerRef.current.startRecording(async (chunk) => {
            if (clientRef.current) {
              try {
                await clientRef.current.sendAudio(chunk);
              } catch (error) {
                console.error('Failed to send audio chunk:', error);
                // エラー発生時は録音停止処理へ
                if (isRecording) {
                  // 再帰呼び出しを防ぐため isRecording をチェック
                  await handleToggleRecording();
                }
                toast.error('音声入力を停止しました。');
              }
            }
          });
          setIsRecording(true);
        } else {
          throw new Error('RTClient or AudioHandler not ready for recording.');
        }
      } catch (error) {
        console.error('Failed to start recording:', error);
        toast.error('音声入力の開始に失敗しました。');
        await stopAndCleanupAudioHandler();
        await disconnectRtClient();
        setIsRecording(false);
      }
    } else {
      // --- 録音停止 ---
      setIsRecording(false);
      await stopAndCleanupAudioHandler();
    }
  };

  // コンポーネントのアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        await stopAndCleanupAudioHandler();
        await disconnectRtClient();
      };
      cleanup().catch(console.error);
    };
  }, []);

  // フィードバック完了を検知してメッセージを更新
  const fetchMessages = async () => {
    try {
      const response = await getChatThreadForFeedback(threadId);
      setMessages(response.messages);
    } catch (error) {
      console.error('Failed to fetch updated messages:', error);
    }
  };

  return (
    <div className="mt-14 flex h-full">
      <ChatPanel
        isRecording={isRecording}
        threadId={threadId}
        messages={messages}
        fetchMessages={fetchMessages}
        onToggleRecording={handleToggleRecording}
      />
    </div>
  );
}
