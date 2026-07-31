'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { LAYOUT_RIGHT_ONLY } from '@/app/_constants/common-usecase';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import PageLayout from '../../_components/layout/page-layout';
import { Form } from '../../_components/ui/form';
import { useFormRedux } from '../../_hooks/use_form';
import { useAppSelector, useAppDispatch } from '../../_store/hooks';
import { setResult, setReAnalysis, setId } from '../../_store/slice/company-analysis';
import AnalysisDisplay from './_components/analysis-display';
import CompanyAnalysisConsiderationsArea from './_components/company-analysis-considerations-area';
import CompanyAnalysisPurpose from './_components/company-analysis-purpose';
import CompanyAnalysisSubmitButton from './_components/company-analysis-submit-button';
import CompanyAnalyticalMethods from './_components/company-analytical-methods';
import CompanyBusinessName from './_components/company-business-name';
import CompanyName from './_components/company-name';
import CompanyReanalysisRequest from './_components/company-reanalysis-request';
import CompanyTitle from './_components/company-title';
import {
  CompanyAnalysisSchema,
  companyAnalysisSchema,
  companyReAnalysisSchema,
  CompanyReAnalysisSchema,
} from './_utils/schema';
import { companyAnalysis } from './actions/company-analysis';
import { reanalysis } from './actions/reanalysis';

export default function Layout() {
  const { result, reanalysis_request, feedbackAt, ...defaultValues } = useAppSelector(
    (state) => state.companyAnalysis
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<CompanyAnalysisSchema>({
    resolver: zodResolver(companyAnalysisSchema),
    values: defaultValues,
  });
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  const handleCompanyAnalysisSend = async (e: CompanyAnalysisSchema) => {
    try {
      const id = uniqueId();
      const response = await companyAnalysis({
        id,
        company_name: e.company_name,
        analysis_purpose: e.analysis_purpose,
        analytical_methods: e.analytical_methods,
        business_name: e.business_name,
        analysis_considerations: e.analysis_considerations,
      });

      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '分析結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(getMessage('E_F_00110', '分析結果'));
      }
    }
  };
  const companyReAnalysisForm = useForm<CompanyReAnalysisSchema>({
    resolver: zodResolver(companyReAnalysisSchema),
    values: {
      result,
      analytical_methods: defaultValues.analytical_methods,
      reanalysis_request,
    } as CompanyReAnalysisSchema,
  });

  const companyReAnalysisFormAllWatch = useWatch({
    control: companyReAnalysisForm.control,
  });

  useEffect(() => {
    dispatch(setReAnalysis(companyReAnalysisFormAllWatch.reanalysis_request ?? ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyReAnalysisFormAllWatch]);

  const handleReanalysisSend = async (e: CompanyReAnalysisSchema) => {
    try {
      const response = await reanalysis({
        id: defaultValues.id,
        analytical_methods: e.analytical_methods,
        existing_analysis: e.result,
        reanalysis_request: e.reanalysis_request!,
      });

      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt }));
        toast.success(getMessage('I_F_00040', '分析結果'));
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(getMessage('E_F_00110', '分析結果'));
      }
    }
  };

  return (
    <PageLayout className="flex flex-col">
      <CompanyTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {(isLeftOnly || isTwoColumns) && (
          <div
            className={cn('size-full flex flex-col', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCompanyAnalysisSend)}
                className="relative flex h-full flex-col pt-[11px]"
              >
                <div className="h-full space-y-3 overflow-y-auto pb-[48px]">
                  <CompanyName />
                  <CompanyAnalyticalMethods />
                  <CompanyBusinessName />
                  <CompanyAnalysisPurpose />
                  <CompanyAnalysisConsiderationsArea />
                </div>
                <CompanyAnalysisSubmitButton />
              </form>
            </Form>
          </div>
        )}
        {(isRightOnly || isTwoColumns) && (
          <Form {...companyReAnalysisForm}>
            <form
              onSubmit={companyReAnalysisForm.handleSubmit(handleReanalysisSend)}
              className={cn('size-full flex flex-col relative', isTwoColumns && 'w-2/3 min-h-0')}
            >
              <div className="h-full overflow-y-auto">
                <div className="flex h-full flex-col">
                  <AnalysisDisplay className="mb-3 flex grow flex-col" />
                  <CompanyReanalysisRequest className="flex flex-col" />
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </PageLayout>
  );
}
