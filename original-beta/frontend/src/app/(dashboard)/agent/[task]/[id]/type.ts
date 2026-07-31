import { RefAnsItem } from '../_actions/schema';

export type AgentStep = {
  status: Status;
  title: string;
  desc: string;
  segments?: RefAnsItem[];
};

export enum Status {
  Complete = 'completed',
  Fail = 'failed',
  InProgress = 'in_progress',
  NotStarted = 'not_started',
}

export type CitationLink = {
  search_title: string;
  search_path: string;
};
