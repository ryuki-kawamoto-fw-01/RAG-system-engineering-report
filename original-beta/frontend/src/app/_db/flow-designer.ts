'use server';

import { Container } from '@azure/cosmos';
import { FlowDesignerModel } from '../../../config';

export async function flowDesignerDB(container: Container, params: Partial<FlowDesignerModel>) {
  const { resource } = await container.items.create(params);
  return resource;
}
