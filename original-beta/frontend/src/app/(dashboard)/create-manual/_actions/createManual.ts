'use server';

import { manualAzureFunctions } from '../../../../../azure-functions';
export async function createManual(url: string, similarity_threshold: number) {
  const result = await manualAzureFunctions.sendJson<
    {
      url: string;
      similarity_threshold: number;
      is_auto_threshold: boolean;
    },
    {
      statusQueryGetUri: string;
      id: string;
    }
  >('ideathon_content_understanding_fn', 'POST', {
    url,
    similarity_threshold,
    is_auto_threshold: similarity_threshold === -2.0,
  });
  await manualAzureFunctions.sendJson<
    {
      url: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      json_data: any;
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {}
  >('upload-json', 'POST', {
    url,
    json_data: result,
  });

  return {
    success: true,
    url: result.statusQueryGetUri,
    id: result.id,
  };
}
