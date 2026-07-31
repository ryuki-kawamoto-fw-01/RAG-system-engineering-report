'use server';

export async function pollStatus(statusQueryGetUri: string, maxRetry = 120, intervalMs = 60000) {
  let retryCount = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const statusRes = await fetch(statusQueryGetUri);
    if (!statusRes.ok) {
      throw new Error('ステータス取得に失敗しました');
    }
    const statusData = await statusRes.json();
    const runtimeStatus = statusData.runtimeStatus;
    console.log(`Current status: ${runtimeStatus}`);

    if (runtimeStatus === 'Running' || runtimeStatus === 'Pending') {
      if (retryCount >= maxRetry) {
        throw new Error('処理が完了しませんでした');
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      retryCount++;
      continue;
    } else if (runtimeStatus === 'Completed') {
      return statusData;
    } else {
      throw new Error(`処理が異常終了しました: ${runtimeStatus}`);
    }
  }
}
