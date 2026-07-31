import React from 'react';
import PageLayout from '../../_components/layout/page-layout';
import { getUseCases } from './_actions/getUseCases';
import UseCaseTable from './_components/usecase-table';
import { UseCase } from './_type';

export default async function UseCaseSearchPage(): Promise<JSX.Element> {
  const { useCases }: { useCases: UseCase[] } = await getUseCases();

  return (
    <PageLayout>
      <UseCaseTable data={useCases} />
    </PageLayout>
  );
}
