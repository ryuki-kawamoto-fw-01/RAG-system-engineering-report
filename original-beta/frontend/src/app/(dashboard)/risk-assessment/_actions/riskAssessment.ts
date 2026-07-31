'use server';

import { riskAssessmentDB } from '@/app/_db/risk-assessment';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { riskAssessmentContainer } from '../../../../../cosmos';

type RiskAssessmentResponse = {
  result: string;
  log: LLMserviceBackEndLog<'riskAssessment'>;
};

type RiskAssessmentErrorResponse = {
  error: string;
};

type DummyResponse = {
  result: string;
};

export async function createRiskAssessment(
  id: string,
  workerInfo: string,
  machineInfo: string,
  workerCountAndPlacement: string,
  processDetails: string,
  currentMeasures: string
): Promise<RiskAssessmentResponse | RiskAssessmentErrorResponse | DummyResponse> {
  const user = await getCurrentUser();
  // ローカルでの動作確認にはダミーデータを使用
  // if (process.env.NODE_ENV === 'development') {
  //   return {
  //     result: JSON.stringify({
  //       table: {
  //         headers: ['リスク要因', 'リスク評価', '対策内容'],
  //         rows: [
  //           ['プレスの操作ミス', '高', '操作手順の徹底教育\n安全装置の強化'],
  //           ['材料供給時の手指挟み込み', '中', '手袋の着用義務化\n作業手順の見直し'],
  //         ],
  //       },
  //     }),
  //   };
  // }
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        workerInfo: string;
        machineInfo: string;
        workerCountAndPlacement: string;
        processDetails: string;
        currentMeasures: string;
      },
      RiskAssessmentResponse
    >('risk-assessment', 'POST', {
      workerInfo,
      machineInfo,
      workerCountAndPlacement,
      processDetails,
      currentMeasures,
    });

    // log
    await riskAssessmentDB(riskAssessmentContainer, {
      id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      workerInfo,
      machineInfo,
      workerCountAndPlacement,
      processDetails,
      currentMeasures,
      createdAt: new Date(),
      outputForm: JSON.stringify(response.result),
      log: response.log,
    });

    return {
      result: JSON.stringify(response.result),
      log: response.log,
    };
  } catch (error) {
    console.error('Create risk assessment error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
