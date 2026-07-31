'use server';
import { Container } from '@azure/cosmos';
import { SummaryModel } from '../../../config';

export async function createSummaryDB(container: Container, params: Partial<SummaryModel>) {
  const { resource } = await container.items.create(params);
  return resource;
}
