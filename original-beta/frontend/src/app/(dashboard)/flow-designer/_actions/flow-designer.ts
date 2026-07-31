'use server';

import { flowDesignerDB } from '@/app/_db/flow-designer';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { flowDesignerContainer } from '../../../../../cosmos';
import type { FlowDesignerSchema } from '../_utils/schema';

type FlowDesignerResponse = {
  flow_designer_result: string;
  success: boolean;
  log: LLMserviceBackEndLog<'flowDesigner'>;
};

// フロントエンド内部で使用する統一された型
type FlowDesignerResult = {
  result: string;
  success: boolean;
  log: LLMserviceBackEndLog<'flowDesigner'>;
};

type FlowDesignerErrorResponse = {
  error: string;
};

export async function createFlowDesigner(
  id: string,
  data: FlowDesignerSchema
): Promise<FlowDesignerResult | FlowDesignerErrorResponse> {
  const user = await getCurrentUser();

  try {
    // FormDataを作成してmultipart/form-dataとして送信
    const formData = new FormData();
    formData.append('text', data.text);
    formData.append('type', data.type);
    if (data.consideration) {
      formData.append('consideration', data.consideration);
    }

    const response = await useCaseAzureFunctions.sendForm<FlowDesignerResponse>(
      'flow-designer',
      formData
    );

    console.log('createFlowDesigner - response:', response);
    console.log(
      'createFlowDesigner - response.flow_designer_result:',
      response.flow_designer_result
    );
    console.log(
      'createFlowDesigner - response.flow_designer_result type:',
      typeof response.flow_designer_result
    );

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
        outputForm: response.flow_designer_result,
        log: response.log,
      });
    }

    return {
      result: response.flow_designer_result,
      success: response.success,
      log: response.log,
    };
  } catch (error) {
    console.error('Failed to create flow designer:', error);
    return { error: '工程管理表の作成に失敗しました' };
  }
}
