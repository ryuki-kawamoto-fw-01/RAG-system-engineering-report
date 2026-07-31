'use server';

import { useCaseContainer } from '../../../../../cosmos';
import { UseCase } from '../_type';

type Response = {
  useCases: UseCase[];
};

export async function getUseCases(): Promise<Response> {
  const { resources: useCases } = await useCaseContainer.items
    .query<UseCase>({
      query: 'SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)',
    })
    .fetchAll();

  return {
    useCases,
  };
}
