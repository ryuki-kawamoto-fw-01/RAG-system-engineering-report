'use server';

import { TalkScriptResponse, AzureResponse } from '@/app/_actions/types';
import { createTalkScriptDB, updateTalkScriptDB } from '@/app/_db/talk-script';
import { FileReference } from '@/app/_store/slice/talk-script';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { talkScriptContainer } from '../../../../../cosmos';
import { TalkScriptSchema } from '../_utils/schema';

// トークスクリプト作成
export async function createTalkScript(
  id: string,
  data: TalkScriptSchema
): Promise<TalkScriptResponse> {
  const user = await getCurrentUser();
  try {
    // filesは既にFileReferenceの配列として保存されているはず
    const answerResponse = await useCaseAzureFunctions.sendJson<
      {
        fileList: FileReference[];
        purpose: string;
        partnerCharacteristics: string;
        considerations: string;
      },
      AzureResponse & {
        temp_file: string;
        log: LLMserviceBackEndLog<'talkScript'>;
      }
    >('create-talk-script', 'POST', {
      fileList: Array.isArray(data.files)
        ? data.files
        : Array.from(data.files as unknown as File[]).map((file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
          })),
      purpose: data.purpose,
      partnerCharacteristics: data.partnerCharacteristics.join(','),
      considerations: data.considerations || '',
    });

    // 成功時の処理
    if (answerResponse.success) {
      // log
      await createTalkScriptDB(talkScriptContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        purpose: data.purpose,
        specialty: data.partnerCharacteristics[0].toString(),
        interest: data.partnerCharacteristics[1].toString(),
        intimacy: data.partnerCharacteristics[2].toString(),
        considerations: data.considerations || '',
        inputForm: answerResponse.temp_file,
        outputForm: answerResponse.answer,
        log: answerResponse.log,
      });

      return {
        success: true,
        content: answerResponse.answer,
        log: answerResponse.log,
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
        message: errorObj.error_message || getMessage('E_F_00110', '作成結果'),
      };
    }
    // エラー時の処理
    return {
      success: false,
      message: answerResponse.message || getMessage('E_F_00110', '作成結果'),
    };
  } catch (error) {
    console.error('Error creating talk script:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}

// トークスクリプト修正
export async function fixTalkScript(formData: FormData, id: string): Promise<TalkScriptResponse> {
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<
      AzureResponse & {
        log: LLMserviceBackEndLog<'talkScript'>;
      }
    >('fix-talk-script', formData);
    // 成功時の処理
    if (answerResponse.success) {
      // log
      await updateTalkScriptDB(talkScriptContainer, {
        id,
        createdAt: new Date(),
        modify: formData.get('modify') as string,
        outputForm: answerResponse.answer,
      });
      return {
        success: true,
        content: answerResponse.answer,
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
        message: errorObj.error_message || getMessage('E_F_00110', '作成結果'),
      };
    }
    // エラー時の処理
    return {
      success: false,
      message: answerResponse.message || getMessage('E_F_00110', '作成結果'),
    };
  } catch (error) {
    console.error('Error fixing talk script:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}
