'use server';

import { createQualityStandardDocumentDB } from '@/app/_db/quality-standard-document';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { qualityStandardDocumentContainer } from '../../../../../cosmos';
import type { QualityStandardDocumentSchema } from '../_utils/schema';

type Response = Result<QualityStandardDocumentErrors> & {
  content?: string;
  log?: LLMserviceBackEndLog<'quality-standard-document'>;
};

type QualityStandardDocumentErrors = Record<string, never>;

export async function createQualityStandardDocument(
  id: string,
  data: QualityStandardDocumentSchema
): Promise<Response> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<QualityStandardDocumentSchema, Response>(
      'quality-standard-document',
      'POST',
      data
    );

    if (!response.success) {
      return {
        message: response.message || getMessage('E_F_00110', '品質標準文書作成'),
        success: false,
      };
    }

    // DB log
    await createQualityStandardDocumentDB(qualityStandardDocumentContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      product_name: data.product_name,
      manufacturing_type: data.manufacturing_type,
      applicable_regulations: data.applicable_regulations,
      product_specifications: data.product_specifications,
      quality_characteristics: data.quality_characteristics,
      tolerance_requirements: data.tolerance_requirements,
      existing_inspection_methods: data.existing_inspection_methods,
      additional_considerations: data.additional_considerations,
      document_detail_level: data.document_detail_level,
      result: response.content ?? '',
      log: response.log,
    });

    return {
      content: response.content,
      success: true,
      log: response.log,
    };
  } catch (error) {
    console.error('Create quality standard document error:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '品質標準文書作成'),
      success: false,
    };
  }
}
