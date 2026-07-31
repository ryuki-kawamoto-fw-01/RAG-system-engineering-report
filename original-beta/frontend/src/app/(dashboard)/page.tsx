import { version } from '../../../config';
import PageLayout from '../_components/layout/page-layout';
// import { ImportantNotificationList } from '../_components/notification/important-notification-list';
import { NotificationList } from '../_components/notification/notification-list';
// import Character from '../_components/ui/character';
import RecommendedUsecase from '../_components/usecase/recommended-usecase';

export default function HomePage() {
  return (
    <PageLayout className="p-5">
      <NotificationList />
      {/* 重要なお知らせがあるときだけ表示する */}
      {/* <ImportantNotificationList /> */}
      <div className="mt-20 flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
        {/* <Character /> */}
        <RecommendedUsecase className="max-w-[520px]" />
      </div>
      <div className="fixed bottom-0 right-0 p-2 text-xs">バージョン {version}</div>
    </PageLayout>
  );
}
