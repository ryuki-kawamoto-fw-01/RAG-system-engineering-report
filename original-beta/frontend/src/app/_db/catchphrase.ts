'use server';
import { Container } from '@azure/cosmos';
import { CatchphraseModel } from '../../../config';

export async function productCatchphraseDB(
  container: Container,
  params: Partial<CatchphraseModel>
) {
  const { resource: catchphrase } = await container.items.create(params);
  return catchphrase;
}
