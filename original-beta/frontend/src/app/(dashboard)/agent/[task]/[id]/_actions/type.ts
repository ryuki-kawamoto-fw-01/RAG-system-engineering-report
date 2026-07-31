export type ErrorResponse = {
  success: false;
  data: {
    error: string;
    status_code: number;
    log_details: {
      error_type: string;
      timestamp: string;
      tags: string[];
    };
  };
};

export type ToolCall = {
  function: {
    arguments: string;
    name: string;
  };
  id: string;
  type: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  tool_calls?: ToolCall[];
};

export type PlanningInput = {
  question: string;
  model: string;
  task: string;
  chatHistory: Message[];
  fileName?: string | null | undefined;
  mediaType?: string | null | undefined;
  fileUrl?: string | null | undefined;
  file_prefix?: string | null | undefined;
};

export type PlanningData = {
  plan: ToolCall[];
  messages: Message[];
  user_message_rev: string;
  desc: string;
};

export type PlanningOutput = {
  success: true;
  data: PlanningData;
};

export type ToolUseInput = {
  tool_calls: ToolCall[];
  task: string;
  messages: Message[];
  model: string;
  file_prefix?: string | null | undefined;
};

export type ToolUseOutput = {
  success: true;
  data: {
    messages: Message[];
    tool_outputs: Array<{
      tool_call_id: string;
      output: string;
    }>;
    desc: string;
  };
};

export type ReflectionInput = {
  model: string;
  task: string;
  user_message_rev: string;
  messages: Message[];
};

export type ReflectionData = {
  messages: Message[];
  complete: boolean;
  tool_calls: ToolCall[];
  desc: string;
};

export type ReflectionOutput = {
  success: true;
  data: ReflectionData;
};

export type MergeInput = {
  model: string;
  user_message_rev: string;
  messages: Message[];
};

export type MergeData = {
  messages: Message[];
  answer: string;
  desc: string;
};

export type MergeOutput = {
  success: true;
  data: MergeData;
};
