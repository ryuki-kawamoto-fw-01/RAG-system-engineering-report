'use server';
import { type Message } from 'ai/react';
import { ErrorResponse } from '@/app/_actions/types';
import { mfgAzureFunctions } from '../../../../../azure-functions';
import { CHAT_API_ERROR_MSG } from '../../../../../config';

export type AnalysisMessage = Message & {
  file_name?: string;
  file_content?: string;
  createdAt?: Date;
};

type SuccessAnalysisResponse<T> = {
  success: true;
  messages: T;
};

type Response<T> = SuccessAnalysisResponse<T> | ErrorResponse;

type AnalysisResponse = {
  messages: AnalysisMessage[];
};

type Props = {
  messages: AnalysisMessage[];
};

export async function sendAnalysisChat(props: Props): Promise<Response<AnalysisResponse>> {
  try {
    const response = await mfgAzureFunctions.sendJson<Props, AnalysisResponse>(
      'analyze',
      'POST',
      props
    );
    return { success: true, messages: response };
  } catch (error) {
    console.error('analysis error:', error);
    return { success: false, message: CHAT_API_ERROR_MSG };
  }
}
