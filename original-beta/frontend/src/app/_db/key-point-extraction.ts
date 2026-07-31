'use server';
import { Container } from '@azure/cosmos';
import { KeyPointExtractionModel } from '../../../config';

export async function createKeyPointExtractionDB(
  container: Container,
  params: Partial<KeyPointExtractionModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}
