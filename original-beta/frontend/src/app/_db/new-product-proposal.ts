'use server';
import { Container } from '@azure/cosmos';
import { NewProductProposalModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function newproductProposalDB(
  container: Container,
  params: Partial<NewProductProposalModel>
) {
  const { resource: marketresearch } = await container.items.create(params);
  return marketresearch;
}

export async function updateproductProposalDB(
  container: Container,
  params: Partial<NewProductProposalModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<NewProductProposalModel>();

  if (!resource) {
    throw new Error(`NewProductProposal with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
