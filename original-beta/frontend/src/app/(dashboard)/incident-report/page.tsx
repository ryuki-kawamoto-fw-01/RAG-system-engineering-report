'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { selectIncidentReport } from '@/app/_store/selectors/incident-report';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import IncidentInputForm from './_components/incident_input_form';
import IncidentResultDisplay from './_components/incident_result_form';
import IncidentTitle from './_components/incident_title';

export default function IncidentReportPage() {
  // incidentReportResultの有無で初期レイアウトを決定
  const { incidentReportResult } = useAppSelector(selectIncidentReport) ?? {
    incidentReportResult: '',
  };
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } =
    useUseCaseLayout(incidentReportResult);

  return (
    <PageLayout className="flex flex-col">
      <IncidentTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="mt-4 flex flex-1 gap-x-10 overflow-hidden">
        {(isLeftOnly || isTwoColumns) && (
          <IncidentInputForm
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
          />
        )}
        {(isRightOnly || isTwoColumns) && (
          <IncidentResultDisplay className={cn('w-full', isTwoColumns && 'w-2/3')} />
        )}
      </div>
    </PageLayout>
  );
}
