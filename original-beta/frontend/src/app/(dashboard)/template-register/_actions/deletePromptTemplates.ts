'use server';

import 'server-only';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { Result } from '@/app/_types/result';
import { getMessage } from '@/app/_utils/message';
import { templateContainer } from '../../../../../cosmos';

type Response = Result;

export async function deletePromptTemplates(idList: string[]): Promise<Response> {
  try {
    // チェックされたプロンプトを削除
    for (let i = 0; i < idList.length; i++) {
      // プロンプトテンプレートをIDで取得
      const { resources: templates } = await templateContainer.items
        .query<PromptTemplate>({
          query: 'SELECT * FROM c WHERE c.id = @id',
          parameters: [{ name: '@id', value: idList[i] }],
        })
        .fetchAll();

      // プロンプトテンプレートが存在しない場合、エラーを返す
      if (templates.length === 0) {
        return {
          success: false,
          message: getMessage('E_F_00410', 'プロンプト', idList[i]),
        };
      }

      // プロンプトテンプレートが削除済みの場合、エラーを返す
      if (templates[0].deletedAt !== undefined) {
        return {
          success: false,
          message: getMessage('E_F_00420', 'プロンプト', idList[i]),
        };
      }

      // プロンプトテンプレートを論理削除
      const now = new Date().getTime();

      await templateContainer.items.upsert({
        ...templates[0],
        deletedAt: now,
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
}
