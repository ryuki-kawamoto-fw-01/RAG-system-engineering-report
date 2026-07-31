'use server';
import { Container } from '@azure/cosmos';
import { ScheduleModel } from '../../../config';

export async function createScheduleDB(container: Container, params: ScheduleModel) {
  const { resource } = await container.items.create(params);
  return resource;
}
