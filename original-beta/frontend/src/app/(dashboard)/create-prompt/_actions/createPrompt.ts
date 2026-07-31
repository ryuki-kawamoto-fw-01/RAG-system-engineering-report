'use server';

import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { createPrompt as createPromptDB } from './promptDB';

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

export async function createPrompt(id: string, data: { originalPrompt: string }) {
  const user = await getCurrentUser();
  try {
    const response = await fetch(getUrl('create-prompt'), {
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
    await createPromptDB({
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      originalPrompt: data.originalPrompt || '',
      outputForm: result.answer,
      log: result.log,
    });

    return { content: result.answer };
  } catch (error) {
    console.error('Create prompt error:', error);

    if (error instanceof Error) {
      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        throw new Error(errorObj.error_message);
      }
    }
    throw new Error(getMessage('E_F_00110', '作成結果'));
  }
}
