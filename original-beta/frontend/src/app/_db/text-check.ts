'use server';
import { Container } from '@azure/cosmos';
import { TextCheckModel } from '../../../config';

export async function textCheckDB(container: Container, params: Partial<TextCheckModel>) {
  const { resource: textCheck } = await container.items.create(params);
  return textCheck;
}
