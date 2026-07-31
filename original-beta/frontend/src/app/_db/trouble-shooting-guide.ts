'use server';

import { Container } from '@azure/cosmos';
import { TroubleShootingGuideModel } from '../../../config';

export async function troubleShootingGuideDB(
  container: Container,
  params: Partial<TroubleShootingGuideModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}
