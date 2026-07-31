'use server';
import { Container } from '@azure/cosmos';
import { TextCorrectionModel } from '../../../config';

export async function createTextCorrectionDB(container: Container, params: TextCorrectionModel) {
  const { resource } = await container.items.create(params);
  return resource;
}
