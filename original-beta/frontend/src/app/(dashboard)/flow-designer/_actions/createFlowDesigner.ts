'use server';

import { flowDesignerDB } from '@/app/_db/flow-designer';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { uniqueId } from '@/app/_utils/uniqueId';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { flowDesignerContainer } from '../../../../../cosmos';
import type { FlowDesignerRequest, FlowDesignerResult } from '../_store/types';

type FlowDesignerResponse = {
  result: string;
  success: boolean;
  log: LLMserviceBackEndLog<'flowDesigner'>;
};

export async function createFlowDesigner(data: FlowDesignerRequest): Promise<FlowDesignerResult> {
  const user = await getCurrentUser();
  const id = uniqueId();

  try {
    const response = await useCaseAzureFunctions.sendJson<
      FlowDesignerRequest,
      FlowDesignerResponse
    >('flow-designer', 'POST', data);

    // CosmosDBにログを保存（コンテナが存在する場合のみ）
    if (flowDesignerContainer) {
      await flowDesignerDB(flowDesignerContainer, {
        id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        text: data.text,
        type: data.type,
        consideration: data.consideration || '',
        outputForm: response.result,
        log: response.log,
      });
    }

    return {
      result: response.result,
      success: response.success,
      log: response.log,
    };
  } catch (error) {
    console.error('Failed to create flow designer:', error);
    throw new Error('工程管理表の作成に失敗しました');
  }
}
