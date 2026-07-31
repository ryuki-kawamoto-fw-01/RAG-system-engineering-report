'use server';

// import { updateDesignDocumentDB } from '@/app/_db/design-document';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
// import { createDesignDocumentContainer } from '../../../../../cosmos';

type NewIdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type NewIdeaErrorResponse = {
  error: string;
};

export async function NewDesignDocument(
  result: string,
  newIdeaRequest: string
): Promise<NewIdeaResponse | NewIdeaErrorResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        newIdeaRequest: string;
      },
      NewIdeaResponse
    >('create-new-design-document', 'POST', {
      result,
      newIdeaRequest,
    });

    // log
    // await updateDesignDocumentDB(createDesignDocumentContainer, {
    //   id,
    //   createdAt: new Date(),
    //   newIdeaRequest,
    //   outputForm: response.answer,
    //   log: response.log,
    // });
    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('create-new-design-document error:', error);

    if (error instanceof Error) {
      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        return { error: errorObj.error_message };
      }
    }
    return { error: '追加の設計書の作成中にエラーが発生しました' };
  }
}
