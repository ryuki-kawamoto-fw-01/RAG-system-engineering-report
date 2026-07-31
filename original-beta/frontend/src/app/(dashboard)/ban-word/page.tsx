import PageLayout from '../../_components/layout/page-layout';
import { getBanWords } from './_actions/getBanWords';
import BanWordTable from './_components/ban-word-table';

export default async function BanWordPage() {
  const { banWords } = await getBanWords();

  return (
    <PageLayout>
      <BanWordTable data={banWords} />
    </PageLayout>
  );
}
