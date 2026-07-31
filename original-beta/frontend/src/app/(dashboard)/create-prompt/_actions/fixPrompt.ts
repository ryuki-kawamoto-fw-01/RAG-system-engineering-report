'use server';

import { getMessage } from '@/app/_utils/message';
import { updatePrompt } from './promptDB';

function getUrl(functionName: string): string {
  const endpoint = process.env.ORCHESTRATOR_USE_CASE_API_ENDPOINT;
  const credential = process.env.ORCHESTRATOR_USE_CASE_API_CREDENTIAL;
  if (!endpoint || !credential) {
    throw new Error(
      'ORCHESTRATOR_USE_CASE_API_ENDPOINT and ORCHESTRATOR_USE_CASE_API_CREDENTIAL must be set'
    );
  }
  return `${endpoint}/${functionName}?code=${credential}`;
}

export async function fixPrompt(
  id: string,
  data: { enhancedPrompt: string; revisionPrompt: string }
) {
  try {
    const response = await fetch(getUrl('fix-prompt'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorRes = await response.json();
      return { error: errorRes.error_message || getMessage('E_F_00110', '作成結果') };
    }
    const result = await response.json();

    // log
    await updatePrompt({
      id,
      ...data,
      outputForm: result.anser,
      log: result.log,
    });

    return { content: result.answer };
  } catch (error) {
    console.error('Fix prompt error:', error);
    throw new Error(error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'));
  }
}
