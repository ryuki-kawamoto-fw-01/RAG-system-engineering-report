import { z } from 'zod';

const MessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(['system', 'user', 'assistant', 'function', 'data', 'tool']),
});

const DeepResearchBaseSchema = z.object({
  id: z.string(),
  mode: z.literal('deep-research'),
  messages: z.array(MessageSchema).min(1, 'messagesは1個以上必要です。'),
});

export const SendDeepResearchInputSchema = DeepResearchBaseSchema.refine(
  (data) => {
    const lastHumanMessage = data.messages[data.messages.length - 1];
    return lastHumanMessage?.content;
  },
  {
    message: '最後のメッセージはcontentが必要です。',
    path: ['messages'],
  }
).refine(
  (data) => {
    const lastHumanMessage = data.messages[data.messages.length - 1];
    return lastHumanMessage?.role === 'user';
  },
  {
    message: '最後のメッセージはroleがuserである必要があります。',
    path: ['messages'],
  }
);

export type SendDeepResearchInput = z.infer<typeof SendDeepResearchInputSchema>;
