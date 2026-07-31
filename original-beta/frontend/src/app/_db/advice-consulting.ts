'use server';

import { Container } from '@azure/cosmos';
import { AdviceConsultingModel } from '../../../config';

export async function adviceConsultingDB(
  container: Container,
  params: Partial<AdviceConsultingModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}
