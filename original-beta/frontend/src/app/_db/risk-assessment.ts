'use server';

import { Container } from '@azure/cosmos';
import { RiskAssessmentModel } from '../../../config';

export async function riskAssessmentDB(container: Container, params: Partial<RiskAssessmentModel>) {
  const { resource } = await container.items.create(params);
  return resource;
}
