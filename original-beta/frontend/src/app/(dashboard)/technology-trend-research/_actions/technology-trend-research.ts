'use server';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';

type TrendResearchResponse = {
  answer: string;
};

export async function technologytrendResearch(
  id: string,
  technicalField: string,
  timeRange: string,
  targetArea: string,
  reportFormat?: string
): Promise<TrendResearchResponse> {
  // const user = getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        technicalField: string;
        timeRange: string;
        targetArea: string;
        reportFormat?: string;
      },
      TrendResearchResponse
    >('technology-trend-research', 'POST', {
      technicalField,
      timeRange,
      targetArea,
      reportFormat,
    });

    // log
    // await trendResearchDB(trendresearchContainer, {
    //   id,
    //   userId: user.id,
    //   createdAt: new Date(),
    //   title: undefined,
    //   inputForm: technicalField,
    //   positionForm: timeRange,
    //   quantityForm: targetArea,
    //   considerationForm: reportFormat ?? '',
    //   outputForm: response.answer,
    // });

    return {
      answer: response.answer,
    };
  } catch (error) {
    console.error('Create idea error:', error);
    throw new Error(error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'));
  }
}
