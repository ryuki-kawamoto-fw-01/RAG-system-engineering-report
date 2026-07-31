'use server';

import { technologyTrainingDB } from '@/app/_db/technology-training';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { technologyTrainingContainer } from '../../../../../cosmos';

type TrainingResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'training'>;
};

type TrainingErrorResponse = {
  error: string;
};

export async function technologyTraining(
  id: string,
  technology: string,
  learningLevel: string,
  studyTime: number,
  consideration?: string
): Promise<TrainingResponse | TrainingErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        technology: string;
        learningLevel: string;
        studyTime: number;
        consideration?: string;
      },
      TrainingResponse
    >('technology-training', 'POST', {
      technology,
      learningLevel,
      studyTime,
      consideration,
    });

    // log
    await technologyTrainingDB(technologyTrainingContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      technology,
      learningLevel,
      studyTime,
      consideration,
      outputForm: response.answer,
      log: response.log,
    });

    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('Create technology training  error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
