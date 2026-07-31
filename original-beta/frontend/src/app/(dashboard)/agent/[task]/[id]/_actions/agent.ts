'use server';

import { getCurrentUser } from '@/app/_utils/auth';
import { AgentAzureFunctions } from '../../../../../../../azure-functions';
import { RefAnsItem } from '../../_actions/schema';
import { ErrorResponse } from './type';
import {
  PlanningInput,
  PlanningOutput,
  ToolUseInput,
  ToolUseOutput,
  ReflectionInput,
  ReflectionOutput,
  MergeInput,
  MergeOutput,
  PlanningData,
  ToolCall,
  Message,
  ReflectionData,
  MergeData,
} from './type';

export type FileList = { url: string; name: string; type: string }[];

export async function callAzureAgentFunction<FReq, FRes>(
  functionName: string,
  body: FReq
): Promise<FRes | ErrorResponse> {
  try {
    getCurrentUser();
    const response = await AgentAzureFunctions.sendJson<FReq, FRes>(functionName, 'POST', body);
    return response;
  } catch (error) {
    console.error(`Failed to call Azure function ${functionName}:`, error);
    throw error;
  }
}

export async function planning(
  input: string,
  files: FileList,
  model: string,
  task: string,
  file_prefix: string | undefined = undefined
): Promise<PlanningData> {
  const planningInput: PlanningInput = {
    question: input,
    model,
    task,
    chatHistory: [],
    mediaType: files.length > 0 ? files[0].type : undefined,
    fileName: files.length > 0 ? files[0].name : undefined,
    fileUrl: files.length > 0 ? files[0].url : undefined,
    file_prefix,
  };

  const response = await callAzureAgentFunction<PlanningInput, PlanningOutput>(
    'planning',
    planningInput
  );

  if (!response.success) {
    throw new Error(response.data.error);
  }

  return response.data;
}

export async function toolUse(
  toolCalls: ToolCall[],
  messages: Message[],
  task: string,
  model: string,
  file_prefix: string | undefined = undefined
): Promise<{ messages: Message[]; segments: RefAnsItem[] }> {
  const toolUseInput: ToolUseInput = {
    tool_calls: toolCalls,
    task,
    messages,
    model,
    file_prefix,
  };

  const response = await callAzureAgentFunction<ToolUseInput, ToolUseOutput>(
    'tool-use',
    toolUseInput
  );

  if (!response.success) {
    throw new Error(response.data.error);
  }

  const segments: RefAnsItem[] = [];
  for (const output of response.data.tool_outputs) {
    try {
      const tool_output = JSON.parse(output.output);
      if (tool_output.segments) {
        for (const segment of tool_output.segments) {
          segments.push(segment);
        }
      }
    } catch (error) {
      console.error('関数呼び出しのoutputがJSON形式ではありません。', error);
    }
  }

  return { messages: response.data.messages, segments };
}

export async function reflection(
  userMessageRev: string,
  messages: Message[],
  model: string,
  task: string
): Promise<ReflectionData> {
  const reflectionInput: ReflectionInput = {
    model,
    task,
    user_message_rev: userMessageRev,
    messages,
  };

  const response = await callAzureAgentFunction<ReflectionInput, ReflectionOutput>(
    'reflection',
    reflectionInput
  );

  if (!response.success) {
    throw new Error(response.data.error);
  }

  return response.data;
}

export async function merge(
  userMessageRev: string,
  messages: Message[],
  model: string
): Promise<MergeData> {
  const mergeInput: MergeInput = {
    model,
    user_message_rev: userMessageRev,
    messages,
  };

  const response = await callAzureAgentFunction<MergeInput, MergeOutput>('merge', mergeInput);

  if (!response.success) {
    throw new Error(response.data.error);
  }

  return response.data;
}
