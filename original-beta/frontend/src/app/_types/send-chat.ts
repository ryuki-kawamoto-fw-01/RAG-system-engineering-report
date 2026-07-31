import { Container } from '@azure/cosmos';
import { ChatMessageModel } from '../../../config';
import { SendChatInput } from '../_schemas/send-chat';

export type ChatContext = SendChatInput & {
  messageContainer: Container;
  threadContainer: Container;
  orchestratorApiUrl: string;
  model: string;
  searchMethod?: string;
};

export type UpsertThreadDocumentInput = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userDepartmentName: string;
  title: string;
  model: string;
  searchMethod?: string;
  category?: string;
};

export type CreateMessageDocumentInput = {
  threadId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userDepartmentName: string;
  content: string;
  role: ChatMessageModel['role'];
  model: string;
  chatProcessingTime?: number;
  inputTokens?: number;
  outputTokens?: number;
  chatHistory?: Array<{
    role: string;
    content?: string;
  }>;
  searchMethod?: string;
  category?: string;
  templateId?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  departmentName: string;
};
