'use server';
import { Container } from '@azure/cosmos';
import { MarketingStrategyModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function marketingstrategyDB(
  container: Container,
  params: Partial<MarketingStrategyModel>
) {
  const { resource: marketingstrategy } = await container.items.create(params);
  return marketingstrategy;
}

export async function updateMarketingStrategyDB(
  container: Container,
  params: Partial<MarketingStrategyModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<MarketingStrategyModel>();

  if (!resource) {
    throw new Error(`MarketingStrategy with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}

// // テスト用ダミー
// 'use server';

// export type BrainstormingRecord = {
//   id: string;
//   userId: string;
//   useName: string;
//   userEmail: string;
//   userDepartmentName?: string;
//   createdAt: Date;
//   theme: string;
//   expert1: string;
//   expert2: string;
//   outputForm: string;
//   log: unknown;
// };

// const useMock = process.env.NEXT_PUBLIC_USE_MOCK_BRAINSTORMING === 'true';

// export async function brainstormingDB(payload: BrainstormingRecord) {
//   if (useMock) {
//     // 画面確認用：保存はスキップ（必要ならメモリに積むなど）
//     console.log('[mock] brainstormingDB saved:', payload.id);
//     return;
//   }

//   // ← モックでないときだけ cosmos を読み込む（トップレベル import はしない）
//   const { brainstormingContainer } = await import('../../../cosmos');

// 　// Cosmos の実データ保存
//   await brainstormingContainer.items.create({
//     ...payload,
//     createdAt: payload.createdAt.toISOString(),
//   });
// }
