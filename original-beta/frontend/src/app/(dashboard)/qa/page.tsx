import React from 'react';
import PageLayout from '../../_components/layout/page-layout';
import { getQAs } from './_actions/getQAs';
import QATable from './_components/qa-table';
import { QA } from './_type';

export default async function QAPage(): Promise<JSX.Element> {
  const { qas }: { qas: QA[] } = await getQAs();

  return (
    <PageLayout>
      <QATable data={qas} />
    </PageLayout>
  );
}
