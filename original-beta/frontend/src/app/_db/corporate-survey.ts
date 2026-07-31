'use server';
import { Container } from '@azure/cosmos';
import { CorporateSurveyModel } from '../../../config';

export async function createCorporateSurveyDB(container: Container, params: CorporateSurveyModel) {
  const { resource } = await container.items.create(params);
  return resource;
}
