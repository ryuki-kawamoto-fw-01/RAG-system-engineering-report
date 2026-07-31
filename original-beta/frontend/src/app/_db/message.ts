'use server';
import { Container } from '@azure/cosmos';
import { ChatMessageModel } from '../../../config';

export async function createMessageDocument(
  container: Container,
  params: ChatMessageModel | (ChatMessageModel & { chatThreadId: string })
) {
  const { resource: message } = await container.items.create(params);
  return message;
}
