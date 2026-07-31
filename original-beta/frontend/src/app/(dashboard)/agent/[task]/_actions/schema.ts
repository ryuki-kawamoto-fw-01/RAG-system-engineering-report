import { z } from 'zod';

const MAX_CONTENT_LENGTH = 100000;

export enum Status {
  Complete = 'completed',
  Fail = 'failed',
  InProgress = 'in_progress',
  NotStarted = 'not_started',
}

export const MessageContentSchema = z
  .string()
  .min(1, { message: 'メッセージを入力してください' })
  .max(MAX_CONTENT_LENGTH, {
    message: `メッセージは${MAX_CONTENT_LENGTH}文字以内で入力してください`,
  })
  .refine((val) => /[^\s]/.test(val), {
    message: '空白のみのメッセージは送信できません',
  });

export const MessageSchema = z.object({
  id: z.string(),
  content: MessageContentSchema,
  role: z.enum(['user', 'assistant', 'tool']),
});

const RefSchema = z.object({
  text: z.string(),
  citation: z.array(
    z.object({
      search_path: z.string(),
      search_title: z.string(),
    })
  ),
});

export const AgentStepSchema = z.object({
  status: z.enum([Status.Complete, Status.Fail, Status.InProgress, Status.NotStarted]),
  title: z.string(),
  desc: z.string(),
  segments: z.array(RefSchema).optional(),
});

export const CreateMessageSchema = z.object({
  threadId: z.string(),
  message: MessageSchema,
  model: z.string(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  mediaType: z.string().optional(),
  category: z.string().optional(),
  refAns: z.array(RefSchema).optional(),
});

export const UpdateAgentStepsSchema = z.object({
  threadId: z.string(),
  agentSteps: z.array(AgentStepSchema),
});

export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type UpdateAgentStepsInput = z.infer<typeof UpdateAgentStepsSchema>;
export type RefAnsItem = z.infer<typeof RefSchema>;
export type AgentStep = z.infer<typeof AgentStepSchema>;
