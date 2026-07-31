import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/app/_components/ui/button';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectIncidentReport } from '@/app/_store/selectors/incident-report';
import {
  updateIncidentReportInput,
  setIncidentReportResult,
  setIncidentReportId,
} from '@/app/_store/slice/incident-report';
import { cn } from '@/app/_utils/tw-merge';
import { generateIncidentReport } from '../_actions/generateIncidentReport';
import { incidentReportSchema, type IncidentReportSchema } from '../_utills/schema';
import IncidentReportFormFields from './incident_consideration-area';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function IncidentReportInputForm({ switchLayout, className }: Props) {
  const dispatch = useAppDispatch();
  const { incidentReportResult, incidentReportInput } = useAppSelector(selectIncidentReport) ?? {
    incidentReportResult: '',
    incidentReportInput: {},
  };
  const form = useForm<IncidentReportSchema>({
    resolver: zodResolver(incidentReportSchema),
    defaultValues: {
      incidentDateTime: incidentReportInput.incidentDateTime || '',
      incidentLocation: incidentReportInput.incidentLocation || '',
      reporter: incidentReportInput.reporter || '',
      yearsOfService: incidentReportInput.yearsOfService || '',
      workExperience: incidentReportInput.workExperience || '',
      jobDescription: incidentReportInput.jobDescription || '',
      disasterType: incidentReportInput.disasterType || '',
      manualAvailability: incidentReportInput.manualAvailability,
      complianceStatus: incidentReportInput.complianceStatus,
      manualLastUpdated: incidentReportInput.manualLastUpdated
        ? new Date(incidentReportInput.manualLastUpdated)
        : new Date(),
      equipmentName: incidentReportInput.equipmentName || '',
      installationYear: incidentReportInput.installationYear || '',
      lastInspectionDate: incidentReportInput.lastInspectionDate || '',
      maintenanceHistory: incidentReportInput.maintenanceHistory || '',
      equipmentMalfunctionHistory: incidentReportInput.equipmentMalfunctionHistory || '',
    },
    mode: 'onChange',
  });

  // フォームリセットイベント
  useEffect(() => {
    const handleReset = () => {
      form.reset({
        incidentDateTime: '',
        incidentLocation: '',
        reporter: '',
        yearsOfService: '',
        workExperience: '',
        jobDescription: '',
        disasterType: '',
        manualAvailability: undefined,
        complianceStatus: undefined,
        manualLastUpdated: new Date(),
        equipmentName: '',
        installationYear: '',
        lastInspectionDate: '',
        maintenanceHistory: '',
        equipmentMalfunctionHistory: '',
      });
    };
    window.addEventListener('incident-report-form-reset', handleReset);
    return () => {
      window.removeEventListener('incident-report-form-reset', handleReset);
    };
  }, [form]);

  // 入力値をReduxに反映
  useEffect(() => {
    const subscription = form.watch((value) => {
      // デバッグ用: 入力値をターミナルに表示
      // eslint-disable-next-line no-console
      console.log('[IncidentReportInputForm] 入力値:', value);
      dispatch(
        updateIncidentReportInput({
          input: {
            incidentDateTime: value.incidentDateTime || '',
            incidentLocation: value.incidentLocation || '',
            reporter: value.reporter || '',
            yearsOfService: value.yearsOfService || '',
            workExperience: value.workExperience || '',
            jobDescription: value.jobDescription || '',
            disasterType: value.disasterType || '',
            manualAvailability: value.manualAvailability,
            complianceStatus: value.complianceStatus,
            manualLastUpdated: value.manualLastUpdated || null,
            equipmentName: value.equipmentName || '',
            installationYear: value.installationYear || '',
            lastInspectionDate: value.lastInspectionDate || '',
            maintenanceHistory: value.maintenanceHistory || '',
            equipmentMalfunctionHistory: value.equipmentMalfunctionHistory || '',
          },
        })
      );
    });
    return () => subscription.unsubscribe();
  }, [form, dispatch]);

  // 送信処理
  const onSubmit = async (data: IncidentReportSchema) => {
    // デバッグ用: 送信データをターミナルに表示
    // eslint-disable-next-line no-console
    console.log('[IncidentReportInputForm] 送信データ:', data);
    try {
      const response = await generateIncidentReport(data);
      // デバッグ用: レスポンスをターミナルに表示
      // eslint-disable-next-line no-console
      console.log('[IncidentReportInputForm] レスポンス:', response);
      if (response && response.success) {
        if (response.id) {
          dispatch(setIncidentReportId(response.id));
        } else {
          // 保存IDが取得できない場合はフィードバックが失敗する可能性があるため注意喚起
          // eslint-disable-next-line no-console
          console.warn(
            '[IncidentReportInputForm] 保存IDが取得できませんでした。フィードバックが失敗する可能性があります'
          );
        }
        dispatch(updateIncidentReportInput({ input: data }));
        dispatch(setIncidentReportResult(response.content ?? ''));
        toast.success('労働災害報告書を作成しました');
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(response?.message || '労働災害報告書の作成に失敗しました');
      }
    } catch (error) {
      // デバッグ用: エラー内容をターミナルに表示
      // eslint-disable-next-line no-console
      console.error('[IncidentReportInputForm] エラー:', error);
      toast.error('労働災害報告書の作成に失敗しました');
    }
  };

  const isSubmitting = form.formState.isSubmitting;
  const isValid = form.formState.isValid;
  const isAllRequiredValid = isValid;

  return (
    <div className={cn('flex h-full flex-col relative', className)}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full">
          <div className="h-full space-y-3 overflow-y-auto pb-[64px]">
            <IncidentReportFormFields />
          </div>
        </form>
        {/* ボタン部分は下部に絶対固定 */}
        <Button
          type="submit"
          variant="secondary"
          disabled={!isAllRequiredValid || isSubmitting || !isValid}
          className="absolute bottom-0 left-1/2 w-full max-w-[296px] -translate-x-1/2"
          onClick={() => form.handleSubmit(onSubmit)()}
        >
          {isSubmitting ? (
            <span>送信中</span>
          ) : incidentReportResult ? (
            <span>再生成する</span>
          ) : (
            <span>労働災害報告書を作成</span>
          )}
        </Button>
      </FormProvider>
    </div>
  );
}
