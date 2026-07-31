'use server';
import { codeExplanationDB } from '@/app/_db/code-explanation';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { codeExplanationContainer } from '../../../../../cosmos';

type CodeExplanationResponse = {
  result: string;
  success: boolean;
  log: LLMserviceBackEndLog<'codeExplanation'>;
};

type CodeExplanationErrorResponse = {
  error: string;
  success: false;
};

// ローカルでの動作確認用
// type CodeExplanationDammyResponse = {
//   result: string;
//   success: true;
// };

export async function createCodeExplanation(
  id: string,
  programmingLanguage: string,
  code: string
): Promise<CodeExplanationResponse | CodeExplanationErrorResponse> {
  // ローカルでの動作確認の際はダミーデータを返す
  // if (process.env.NODE_ENV === 'development') {
  //   return {
  //     result: 'テストデータです\n2行目',
  //     success: true,
  //   };
  // }
  const user = await getCurrentUser();
  try {
    const answerResponse = await useCaseAzureFunctions.sendJson<
      { programmingLanguage: string; code: string },
      CodeExplanationResponse
    >('code-explanation', 'POST', {
      programmingLanguage,
      code,
    });
    // log
    await codeExplanationDB(codeExplanationContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      programmingLanguage,
      code,
      outputForm: answerResponse.result ?? '',
      log: answerResponse.log,
    });
    return {
      result: answerResponse.result,
      success: true,
      log: answerResponse.log,
    };
  } catch (error) {
    console.error('Error creating JSON data:', error);
    return {
      error: error instanceof Error ? error.message : getMessage('E_F_00110', 'コードの解説'),
      success: false,
    };
  }
}
