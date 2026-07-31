'use server';
import { Container } from '@azure/cosmos';
import { IncidentReportModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createIncidentReportDB(
  container: Container,
  params: Partial<IncidentReportModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateIncidentReportDB(
  container: Container,
  params: Partial<IncidentReportModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<IncidentReportModel>();

  if (!resource) {
    throw new Error(`incidentReport with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
