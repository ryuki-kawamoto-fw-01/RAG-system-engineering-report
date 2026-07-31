'use server';
import { Container } from '@azure/cosmos';
import { NeedsSurveyModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function needsSurveyDB(container: Container, params: Partial<NeedsSurveyModel>) {
  const { resource: designDoc } = await container.items.create(params);
  return designDoc;
}

export async function updateNeedsSurveyDB(container: Container, params: Partial<NeedsSurveyModel>) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<NeedsSurveyModel>();

  if (!resource) {
    throw new Error(`Needs-Survey with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
