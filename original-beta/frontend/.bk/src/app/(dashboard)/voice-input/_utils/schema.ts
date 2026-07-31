import { z } from 'zod';

// Message スキーマ（作成用）
export const CreateMessageSchema = z.object({
  id: z.string().min(1).optional(),
  threadId: z.string().min(1),
  userId: z.string().min(1),
  content: z.string(),
  role: z.enum(['system', 'user', 'assistant', 'data']),
  chatHistory: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ),
  createdAt: z.number(),
});

// Message スキーマ（更新・削除用）
export const MessageSchema = CreateMessageSchema.extend({
  id: z.string().min(1),
  feedbackType: z.enum(['0', '1']).optional(),
  feedbackOption1: z.enum(['0', '1']).optional(),
  feedbackOption2: z.enum(['0', '1']).optional(),
  feedbackOption3: z.enum(['0', '1']).optional(),
  feedbackOption4: z.enum(['0', '1']).optional(),
  feedbackOption5: z.enum(['0', '1']).optional(),
  feedbackOption6: z.enum(['0', '1']).optional(),
  feedbackText: z.string().optional(),
  feedbackAt: z.number().optional(),
});

// Thread スキーマ（作成用）
export const CreateChatThreadSchema = z.object({
  id: z.string().min(1).optional(),
  userId: z.string().min(1),
  title: z.string(),
  forceCreate: z.boolean().optional(),
  updatedAt: z.number(),
  createdAt: z.number(),
});

// Thread スキーマ（更新・削除用）
export const ChatThreadSchema = CreateChatThreadSchema.extend({
  id: z.string().min(1),
  deletedAt: z.number().optional(),
});

export type CreateMessage = z.infer<typeof CreateMessageSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type CreateChatThread = z.infer<typeof CreateChatThreadSchema>;
export type Thread = z.infer<typeof ChatThreadSchema>;
