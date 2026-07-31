'use server';

import { createCorporateSurveyDB } from '@/app/_db/corporate-survey';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { corporateSurveyContainer } from '../../../../../cosmos';
import { CorporateSurveyResponse, CorporateSurveyErrorResponse } from '../_type';

type Props = {
  id: string;
  surveyCompany: string;
  selectedOptions: string[];
  additionalConsideration: string;
};

export async function corporateSurvey(
  props: Props
): Promise<CorporateSurveyResponse | CorporateSurveyErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<Props, CorporateSurveyResponse>(
      'corporate-survey',
      'POST',
      props
    );

    // log
    await createCorporateSurveyDB(corporateSurveyContainer, {
      userId: user.id,
      createdAt: new Date(),
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      ...props,
      outputForm: response.results,
      log: response.log,
    });

    return {
      results: response.results,
      log: response.log,
      // references: response.references,
    };
  } catch (error) {
    console.error('Error corporate survey:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
