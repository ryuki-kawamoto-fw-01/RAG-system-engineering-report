'use server';

import { AzureResponse, DesignDocumentReviewResponse } from '@/app/_actions/types';
import { designDocumentReviewDB } from '@/app/_db/design-document-review';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { designDocumentReviewContainer } from '../../../../../cosmos';

export async function designDocumentReview(
  id: string,
  formData: FormData
): Promise<DesignDocumentReviewResponse> {
  const fileList = formData.get('fileList') ? (formData.getAll('fileList') as File[]) : [];
  const user = await getCurrentUser();

  if (fileList.length === 0) {
    throw new Error('ファイルを１つ以上選択してください');
  }

  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<
      AzureResponse & {
        temp_file: string;
        log: LLMserviceBackEndLog<'design-document-review'>;
      }
    >('design-document-review', formData);

    // 失敗時
    if (!answerResponse.success) {
      const errorAnswerResponse = answerResponse.message;
      console.error('メッセージの送信が失敗しました。', errorAnswerResponse);
      throw new Error(errorAnswerResponse);
    }
    // log
    await designDocumentReviewDB(designDocumentReviewContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      reviewPurpose: formData.get('reviewPurpose')?.toString() || '',
      priorityPoint: formData.get('priorityPoint')?.toString() || '',
      consideration: formData.get('consideration')?.toString() || '',
      outputForm: answerResponse.answer,
      inputForm: answerResponse.temp_file,
      log: answerResponse.log,
    });

    return {
      success: true,
      content: answerResponse.answer,
    };
  } catch (error) {
    console.error('Error design-document-review:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}
