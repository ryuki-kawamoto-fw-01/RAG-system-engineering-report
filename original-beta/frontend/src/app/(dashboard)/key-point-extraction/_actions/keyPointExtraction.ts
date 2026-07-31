'use server';

import { KeyPointExtractionResponse } from '@/app/_actions/types';
import { createKeyPointExtractionDB } from '@/app/_db/key-point-extraction';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { keyPointExtractionContainer } from '../../../../../cosmos';

export async function keyPointExtraction(
  id: string,
  formData: FormData,
  selectedTab: string
): Promise<KeyPointExtractionResponse> {
  const user = await getCurrentUser();
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<KeyPointExtractionResponse>(
      'key-point-extraction',
      formData
    );

    // 成功時の処理
    if (answerResponse.success) {
      await createKeyPointExtractionDB(keyPointExtractionContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        type: selectedTab,
        additionalConsiderations: formData.get('additionalConsiderations') as string,
        keyPointExtractionResult: answerResponse.key_point_extraction_result,
        log: answerResponse.log,
      });

      return {
        // 抽出結果
        key_point_extraction_result: answerResponse.key_point_extraction_result,
        // 成功フラグ
        success: true,
      };
    }

    // エラー時の処理
    return {
      message: answerResponse.message || getMessage('E_F_00110', '抽出結果'),
      success: false,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '抽出結果'),
      success: false,
    };
  }
}
