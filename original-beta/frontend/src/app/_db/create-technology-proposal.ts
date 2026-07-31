'use server';
import { Container } from '@azure/cosmos';
import { TechnologyProposalModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createTechnologyProposalDB(
  container: Container,
  params: Partial<TechnologyProposalModel>
) {
  const { resource: technologyProposal } = await container.items.create(params);
  return technologyProposal;
}

export async function updateTechnologyProposalDB(
  container: Container,
  params: Partial<TechnologyProposalModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<TechnologyProposalModel>();

  if (!resource) {
    throw new Error(`TechnologyProposal with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
