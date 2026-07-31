'use server';

import { qaContainer } from '../../../../../cosmos';
import { QA } from '../_type';

type Response = {
  qas: QA[];
};

export async function getQAs(): Promise<Response> {
  const { resources: qas } = await qaContainer.items
    .query<QA>({
      query: 'SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)',
    })
    .fetchAll();

  return {
    qas,
  };
}
