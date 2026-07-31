'use server';

import { Container } from '@azure/cosmos';
import { AdviceReactModel } from '../../../config';

export async function adviceReactDB(container: Container, params: Partial<AdviceReactModel>) {
  const { resource } = await container.items.create(params);
  return resource;
}
