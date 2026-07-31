import { ChatThreadModel } from '../../../../../../config';
import { AgentStep } from './schema';

export type AgentChatThreadModel = {
  agentSteps: AgentStep[];
} & ChatThreadModel;
