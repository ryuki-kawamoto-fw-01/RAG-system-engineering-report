'use server';

import 'server-only';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { templateContainer } from '../../../../../cosmos';

export async function getPromptTemplates() {
  // プロンプトテンプレートをIDの昇順で取得
  const { resources: templates } = await templateContainer.items
    .query<PromptTemplate>({
      query: 'SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt) ORDER BY c.id ASC',
    })
    .fetchAll();

  return {
    templates,
  };
}
