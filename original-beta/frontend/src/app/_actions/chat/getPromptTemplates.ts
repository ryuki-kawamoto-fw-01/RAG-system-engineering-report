'use server';

import 'server-only';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { templateContainer } from '../../../../cosmos';

const LIMIT = 6;

// チャット画面の初期表示時に表示するテンプレートを取得する
export async function getPromptTemplates(type: string) {
  const { resources: templates } = await templateContainer.items
    .query<PromptTemplate>({
      query: `
          SELECT * FROM c
          WHERE NOT IS_DEFINED(c.deletedAt)
          AND IS_DEFINED(c.description)
          AND c.type = @type
          ORDER BY c.sort ASC
          OFFSET 0 LIMIT ${LIMIT}
      `,
      parameters: [{ name: '@type', value: type }],
    })
    .fetchAll();

  return templates;
}
