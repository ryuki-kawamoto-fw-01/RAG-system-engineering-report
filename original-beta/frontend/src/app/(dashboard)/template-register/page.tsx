import PageLayout from '../../_components/layout/page-layout';
import { PromptTemplate } from '../../_types/prompt-template';
import { getPromptTemplates } from './_actions/getPromptTemplates';
import { PromptTemplateTable } from './_components/template-data-table';

export default async function Page() {
  const { templates } = await getPromptTemplates();

  const data: PromptTemplate[] = [];

  templates.map((template) => {
    data.push({
      id: template.id,
      title: template.title,
      category: template.category,
      content: template.content,
    });
  });

  return (
    <PageLayout>
      <PromptTemplateTable data={data} />
    </PageLayout>
  );
}
