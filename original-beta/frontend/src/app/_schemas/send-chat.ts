import { z } from 'zod';

const MessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(['system', 'user', 'assistant', 'function', 'data', 'tool']),
});

// 各チャット共通 & 簡単なバリデーションはここで定義
const ChatBaseSchema = z.object({
  id: z.string(),
  messages: z.array(MessageSchema).min(1, 'messagesは1個以上必要です。'),
  model: z.string(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  mediaType: z.string().optional(),
  templateId: z.string().optional(),
});

// 各チャット差分 & 複雑なバリデーションはここで定義
export const SendChatInputSchema = z
  .union([
    // 各チャットのInputの違いをここに追加
    ChatBaseSchema.extend({
      mode: z.literal('chat'),
    }),
    ChatBaseSchema.extend({
      mode: z.literal('rag'),
      searchMethod: z.string(),
      category: z.string().optional(),
    }),
  ])
  .refine(
    (data) => {
      const lastHumanMessage = data.messages[data.messages.length - 1];
      return lastHumanMessage?.content;
    },
    {
      message: '最後のメッセージはcontentが必要です。',
      path: ['messages'],
    }
  )
  .refine(
    (data) => {
      const lastHumanMessage = data.messages[data.messages.length - 1];
      return lastHumanMessage?.role === 'user';
    },
    {
      message: '最後のメッセージはroleがuserである必要があります。',
      path: ['messages'],
    }
  );

export type SendChatInput = z.infer<typeof SendChatInputSchema>;
