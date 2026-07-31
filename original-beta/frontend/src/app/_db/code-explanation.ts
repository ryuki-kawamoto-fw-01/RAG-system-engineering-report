'use server';
import { Container } from '@azure/cosmos';
import { CodeExplanationModel } from '../../../config';

export async function codeExplanationDB(
  container: Container,
  params: Partial<CodeExplanationModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}
