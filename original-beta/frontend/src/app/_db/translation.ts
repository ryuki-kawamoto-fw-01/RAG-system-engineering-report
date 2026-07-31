'use server';
import { Container } from '@azure/cosmos';
import { TranslationModel } from '../../../config';

export async function createTranslationDB(container: Container, params: TranslationModel) {
  const { resource } = await container.items.create(params);
  return resource;
}
