import PageLayout from '../../_components/layout/page-layout';
import { getDictionaries } from './_actions/getDictionaries';
import DictionaryTable from './_components/dictionary-table';

export default async function DictionaryPage() {
  const { dictionaries } = await getDictionaries();

  return (
    <PageLayout>
      <DictionaryTable data={dictionaries} />
    </PageLayout>
  );
}
