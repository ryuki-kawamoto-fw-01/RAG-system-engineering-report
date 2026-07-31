'use server';
import { Container } from '@azure/cosmos';
import { ChatThreadModel } from '../../../config';

export async function upsertThreadDocument(container: Container, params: ChatThreadModel) {
  const { resource: thread } = await container.items.upsert<ChatThreadModel>(params);
  return thread;
}
