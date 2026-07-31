'use server';

import { TextCorrectionResponse } from '@/app/_actions/types';
import { createTextCorrectionDB } from '@/app/_db/text-correction';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { textCorrectionContainer } from '../../../../../cosmos';

export async function textCorrection(
  id: string,
  formData: FormData,
  selectedTab: string
): Promise<TextCorrectionResponse> {
  const user = await getCurrentUser();
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<TextCorrectionResponse>(
      'text-correction',
      formData
    );

    // 成功時の処理
    if (answerResponse.success) {
      await createTextCorrectionDB(textCorrectionContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        type: selectedTab,
        documentType: formData.get('documentType') as string,
        checkpoints: formData.get('checkpoints') as string,
        additionalConsiderations: formData.get('additionalConsiderations') as string,
        outputForm: answerResponse.corrected_text.replace(/\\n/g, '\n'),
        pointsOfCriticism: answerResponse.points_of_criticism,
        originalText: answerResponse.original_text,
        log: answerResponse.log,
      });

      return {
        // 指摘事項
        points_of_criticism: answerResponse.points_of_criticism,
        // 校正前文章
        original_text: answerResponse.original_text,
        // 校正後文章
        corrected_text: answerResponse.corrected_text,
        // 成功フラグ
        success: true,
      };
    }

    // 正規表現を使ってJSON部分を抽出
    const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
    const jsonMatch = answerResponse.message?.match(jsonRegex);

    if (jsonMatch) {
      const errorObj = JSON.parse(jsonMatch[0]);
      // エラー時
      return {
        success: false,
        message: errorObj.error_message || getMessage('E_F_00110', '校正結果'),
      };
    }
    // エラー時の処理
    return {
      message: answerResponse.message || getMessage('E_F_00110', '校正結果'),
      success: false,
    };
  } catch (error) {
    console.error('Error creating text correction:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '校正結果'),
      success: false,
    };
  }
}
