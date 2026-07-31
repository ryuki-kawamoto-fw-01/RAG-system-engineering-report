import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectTechassess } from '@/app/_store/selectors/techassess';
import {
  setTechassessResult,
  updateTechassessInput,
  setTechassessId,
} from '@/app/_store/slice/techassess';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { generateTechReport } from '../_actions/generateTechReport';
import { TechassessSchema } from '../_utills/schema';
import TechassessFormFields from './techassess-consideration-area';

type Props = {
  switchLayout: (layout: LayoutType) => void; // ← anyをLayoutTypeに修正
  className?: string;
};

export default function TechassessInputForm({ switchLayout, className }: Props) {
  const dispatch = useAppDispatch();
  const { techassessInput, techassessResult } = useAppSelector(selectTechassess) ?? {
    techassessInput: {},
    techassessResult: '',
  };
  const form = useForm<TechassessSchema>({
    resolver: zodResolver(TechassessSchema),
    defaultValues: techassessInput,
    mode: 'onChange',
    criteriaMode: 'all',
    shouldFocusError: false,
  });

  // フォームリセットイベント
  useEffect(() => {
    const handleReset = () => {
      form.reset({
        field: '',
        region: '',
        companySize: '',
        industryIssues: '',
        granularity: '',
        purpose: '',
      });
    };
    window.addEventListener('techassess-form-reset', handleReset);
    return () => {
      window.removeEventListener('techassess-form-reset', handleReset);
    };
  }, [form]);

  // 入力値をReduxに反映
  useEffect(() => {
    const subscription = form.watch((value) => {
      dispatch(
        updateTechassessInput({
          input: {
            field: value.field || '',
            region: value.region || '',
            companySize: value.companySize || '',
            industryIssues: value.industryIssues || '',
            granularity: value.granularity || '',
            purpose: value.purpose || '',
          },
        })
      );
    });
    return () => subscription.unsubscribe();
  }, [form, dispatch]);

  // 送信処理
  const onSubmit = async (data: TechassessSchema) => {
    const fixedData = {
      ...data,
      companySize: data.companySize || '',
    };
    try {
      // IDを生成
      const generatedId = `techassess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const response = await generateTechReport(generatedId, fixedData);
      if (response && response.success) {
        // IDをReduxに保存
        dispatch(setTechassessId(generatedId));
        dispatch(setTechassessResult(response.results?.content || ''));
        dispatch(updateTechassessInput({ input: data }));
        toast.success(getMessage('I_F_00030', '技術評価レポート'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(response?.message || getMessage('E_F_00110', '技術評価レポート'));
      }
    } catch (error) {
      console.error('[TechassessInputForm] エラー:', error);
      toast.error(getMessage('E_F_00110', '技術評価レポート'));
    }
  };

  const { isValid, isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <TechassessFormFields />
        </div>
        <Button
          type="submit"
          variant="secondary"
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting && <Spinner className="mr-2 size-6 animate-spin" />}
          {isSubmitting ? '作成中です' : techassessResult ? '再生成する' : '作成する'}
        </Button>
      </form>
    </Form>
  );
}
