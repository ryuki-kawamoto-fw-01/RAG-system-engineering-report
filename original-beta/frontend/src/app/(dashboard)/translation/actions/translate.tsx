'use server';

import { createTranslationDB } from '@/app/_db/translation';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { translateContainer } from '../../../../../cosmos';

const orchestratorUseCaseEndpoint = process.env.ORCHESTRATOR_USE_CASE_API_ENDPOINT;
const orchestratorUseCaseCredential = process.env.ORCHESTRATOR_USE_CASE_API_CREDENTIAL;
function getUrl(functionName: string): string {
  if (
    !process.env.ORCHESTRATOR_USE_CASE_API_ENDPOINT ||
    !process.env.ORCHESTRATOR_USE_CASE_API_CREDENTIAL
  ) {
    throw new Error(
      'ORCHESTRATOR_USE_CASE_API_ENDPOINT and ORCHESTRATOR_USE_CASE_API_CREDENTIAL must be set'
    );
  }
  return `${orchestratorUseCaseEndpoint}/${functionName}?code=${orchestratorUseCaseCredential}`;
}

export async function translateText(
  id: string,
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  considerations: string
) {
  const user = await getCurrentUser();
  try {
    const response = await fetch(getUrl('translate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage,
        considerations,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error_message || getMessage('I_F_00030', '翻訳結果') };
    }

    const data = await response.json();

    // log
    await createTranslationDB(translateContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      text,
      sourceLanguage,
      targetLanguage,
      considerations,
      outputForm: data.translatedText,
      log: data.log,
    });

    return {
      translatedText: data.translatedText,
      log: data.log,
    };
  } catch (error) {
    console.error('Translation error:', error);
    if (error instanceof Error) {
      console.error('Error translation:', error.message);

      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        throw new Error(errorObj.error_message);
      }
    }
    throw new Error('翻訳中にエラーが発生しました。');
  }
}
