'use client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { LAYOUT_RIGHT_ONLY } from '@/app/_constants/common-usecase';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import PageLayout from '../../_components/layout/page-layout';
import { useAppDispatch, useAppSelector } from '../../_store/hooks';
import { setResult, setId } from '../../_store/slice/corporate-survey';
import { corporateSurvey } from './_actions/corporateSurvey';
import CorporateSurveyForm from './_components/corporate-survey-form';
import CorporateSurveyResults from './_components/corporate-survey-results';
import CorporateSurveyTitle from './_components/title';
import { SURVEY_ITEMS } from './_constant';
import { CorporateSurvey } from './_type';

export default function Layout() {
  const dispatch = useAppDispatch();
  const { results, ...defaultValues } = useAppSelector((state) => state.corporateSurvey);

  // Web検索対応時にコメントアウトを外す
  // const [referenceSource, setReferenceSource] = useState<string>('');
  // const [isReferencesPanelOpen, setIsReferencesPanelOpen] = useState(false);

  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(
    results ?? ''
  );

  const form = useForm<CorporateSurvey>({
    values: { ...(defaultValues as CorporateSurvey) },
  });

  const onSubmit = async (data: CorporateSurvey) => {
    try {
      const id = uniqueId();
      const response = await corporateSurvey({
        id,
        surveyCompany: data.surveyCompany,
        selectedOptions: data.selectedOptions,
        additionalConsideration: data.additionalConsideration,
      });

      if ('error' in response) {
        toast.error(response.error);
      } else {
        const industryOption = data.selectedOptions.find((option) =>
          option.startsWith(SURVEY_ITEMS.CHALLENGES.PROPOSALS)
        );

        // localstorageに「当社の業界」を保存
        if (industryOption) {
          const selectedIndustry = industryOption.split('当社の業界：')[1];
          localStorage.setItem('selectedIndustry', selectedIndustry);
        }

        dispatch(
          setResult({
            selectedOptions: form.watch('selectedOptions', []),
            additionalConsideration: data.additionalConsideration,
            results: response.results,
            feedbackAt: undefined,
          })
        );
        dispatch(setId(id));
        // setReferenceSource(response.references);
        toast.success(getMessage('I_F_00030', '調査結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      }
    } catch (error) {
      console.error(error);
      toast.error(getMessage('E_F_00110', '調査結果'));
    }
  };

  return (
    <PageLayout className="flex flex-col">
      <CorporateSurveyTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div
        className="flex flex-1 gap-x-10 overflow-hidden transition-all duration-300"
        // Web検索対応時に以下のstyleを使用
        // className={`flex h-full gap-10 transition-all duration-300 ${isReferencesPanelOpen ? 'mr-[400px]' : ''}`}
      >
        {(isLeftOnly || isTwoColumns) && (
          <CorporateSurveyForm
            form={form}
            onSubmit={onSubmit}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
          />
        )}
        {(isRightOnly || isTwoColumns) && (
          <CorporateSurveyResults
            className={cn('w-full', isTwoColumns && 'w-2/3')}
            // Web検索対応時にコメントアウトを外す
            // referenceSource={referenceSource}
            // isReferencesPanelOpen={isReferencesPanelOpen}
            // setIsReferencesPanelOpen={setIsReferencesPanelOpen}
          />
        )}
      </div>
    </PageLayout>
  );
}
