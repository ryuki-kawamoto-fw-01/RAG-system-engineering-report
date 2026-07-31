'use server';

import { NewMailResponse, AzureResponse, ReplyMailResponse } from '@/app/_actions/types';
import {
  createNewMailDB,
  createReplyMailDB,
  updateNewMailDB,
  updateReplyMailDB,
} from '@/app/_db/mail';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { createNewMailContainer } from '../../../../../cosmos';

// 新規メール作成
export async function createNewMail(id: string, formData: FormData): Promise<NewMailResponse> {
  const user = await getCurrentUser();
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<NewMailResponse>(
      'create-new-mail',
      formData
    );

    // 成功時の処理
    if (answerResponse.success) {
      // log
      await createNewMailDB(createNewMailContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        mode: 'newMail',
        createdAt: new Date(),
        mailTo: formData.get('newMailTo') as string,
        mailFrom: formData.get('newMailFrom') as string,
        mailPurpose: formData.get('newMailPurpose') as string,
        mailContent: formData.get('newMailContent') as string,
        mailConsiderations: (formData.get('newMailConsiderations') as string) || '',
        subject: answerResponse.subject,
        outputForm: answerResponse.content,
        log: answerResponse.log,
      });

      return {
        subject: answerResponse.subject,
        content: answerResponse.content,
        success: true,
        log: answerResponse.log,
      };
    }

    // エラー時の処理
    return {
      message: answerResponse.message || getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  } catch (error) {
    console.error('Error creating new mail:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}

// 返信メール作成
export async function createReplyMail(id: string, formData: FormData): Promise<ReplyMailResponse> {
  const user = await getCurrentUser();
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<
      AzureResponse & {
        temp_file: string;
        log: LLMserviceBackEndLog<'replyMail'>;
      }
    >('create-reply-mail', formData);

    // 成功時の処理
    if (answerResponse.success) {
      // log
      await createReplyMailDB(createNewMailContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        mode: 'replyMail',
        type: formData.get('activeTab') as string,
        reception: (formData.get('replyMailReception') as string) ?? answerResponse.temp_file,
        mailTo: formData.get('replyMailTo') as string,
        mailFrom: formData.get('replyMailFrom') as string,
        mailPurpose: formData.get('replyMailPurpose') as string,
        mailContent: formData.get('replyMailContent') as string,
        mailConsiderations: (formData.get('replyMailConsiderations') as string) || '',
        outputForm: answerResponse.answer,
        log: answerResponse.log,
      });
      return {
        success: true,
        content: answerResponse.answer,
        log: answerResponse.log,
      };
    }

    // エラー時の処理
    return {
      success: false,
      message: answerResponse.message || getMessage('E_F_00110', '作成結果'),
    };
  } catch (error) {
    console.error('Error creating reply mail:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}

// 新規メール修正
export async function fixNewMail(formData: FormData, id: string): Promise<NewMailResponse> {
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<NewMailResponse>(
      'fix-new-mail',
      formData
    );

    // 成功時の処理
    if (answerResponse.success) {
      // log
      await updateNewMailDB(createNewMailContainer, {
        id,
        modify: formData.get('modify') as string,
        subject: answerResponse.subject,
        outputForm: answerResponse.content,
        log: answerResponse.log,
      });
      return {
        subject: answerResponse.subject,
        content: answerResponse.content,
        log: answerResponse.log,
        success: true,
      };
    }

    // エラー時の処理
    return {
      message: answerResponse.message || getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  } catch (error) {
    console.error('Error fixing new mail:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}

// 返信メール修正
export async function fixReplyMail(formData: FormData, id: string): Promise<ReplyMailResponse> {
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<
      AzureResponse & {
        log: LLMserviceBackEndLog<'replyMail'>;
      }
    >('fix-reply-mail', formData);

    // 成功時の処理
    if (answerResponse.success) {
      // log
      await updateReplyMailDB(createNewMailContainer, {
        id,
        modify: formData.get('modify') as string,
        outputForm: answerResponse.answer,
        log: answerResponse.log,
      });
      return {
        success: true,
        content: answerResponse.answer,
        log: answerResponse.log,
      };
    }

    // エラー時の処理
    return {
      message: answerResponse.message || getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  } catch (error) {
    console.error('Error fixing reply mail:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}
