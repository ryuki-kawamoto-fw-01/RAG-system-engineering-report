import PageLayout from '../../_components/layout/page-layout';
import { getHiyariHats } from './_actions/get_hiyari_hat';
import HiyariHatTableWrapper from './_components/HiyariHatTableWrapper';

export default async function HiyariHatPage() {
  const { hiyariHats, error } = await getHiyariHats();

  // エラーがある場合はトースト表示（ただし、サーバーサイドなので実際にはクライアントサイドで表示する必要がある）
  if (error) {
    console.error('ヒヤリハットページエラー:', error);
  }

  return (
    <PageLayout>
      <HiyariHatTableWrapper data={hiyariHats} error={error} />
    </PageLayout>
  );
}
