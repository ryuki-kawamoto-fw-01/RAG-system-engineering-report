import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Spinner } from '@/app/_components/icon/decorative';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { add, setId, setResult } from '@/app/_store/slice/sales-forecast';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Button } from '../../../_components/ui/button';
import { salesForecast } from '../_actions/sales-forecast';
import { salesForecastSchema, SalesForecastSchema } from '../_utils/schema';
import AnalysisPrioritiesFields from './analysis-priorities-fields';
import CompetingInformationFields from './competing-information-fields';
import NewProductFields from './new-product-fields';
import TargetMarketFields from './target-market-fields';

type Props = {
  className?: string;
  setIsSalesForecast: (isSubmitting: boolean) => void;
  switchLayout: (layout: LayoutType) => void;
};

export default function InputForm({
  className,
  setIsSalesForecast,
  switchLayout,
}: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const defaultValues = useAppSelector((state) => state.salesForecast);
  const form = useFormRedux<SalesForecastSchema>({
    resolver: zodResolver(salesForecastSchema),
    values: defaultValues,
    setRedux: add,
  });

  const {
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = form;

  //分析中かどうか
  useEffect(() => {
    setIsSalesForecast(isSubmitting);
  }, [isSubmitting, setIsSalesForecast]);

  //フォーム送信時の処理
  const handleSalesForecastInputSend = async (data: SalesForecastSchema) => {
    try {
      const id = uniqueId();
      const productCategory = [
        ...data.productCategory.filter((v) => v !== 'その他'),
        ...(data.productCategoryOther ? [data.productCategoryOther] : []),
      ];
      const targetIndustry = [
        ...data.targetIndustry.filter((v) => v !== 'その他の対象業界'),
        ...(data.targetIndustryOther ? [data.targetIndustryOther] : []),
      ];
      const targetCustomers = [
        ...data.targetCustomers.filter((v) => v !== 'その他の対象顧客'),
        ...(data.targetCustomersOther ? [data.targetCustomersOther] : []),
      ];
      const targetRegions = [
        ...data.targetRegions.filter((v) => v !== 'その他の地域'),
        ...(data.targetRegionsOther ? [data.targetRegionsOther] : []),
      ];
      //　分析API呼び出し
      const response = await salesForecast(
        id,
        data.productName,
        productCategory,
        data.features,
        data.useCase,
        data.analysisPriorities,
        targetIndustry,
        targetCustomers,
        targetRegions,
        data.marketData,
        data.competingProducts
      );
      // 呼び出し成功
      if (response.success) {
        const salesForecast = response.content;
        dispatch(setResult({ result: salesForecast, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
        // 呼び出し失敗
      } else {
        toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
      }
    } catch (error) {
      console.error('Error salesForecast:', error);
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleSalesForecastInputSend)}
        className={cn('relative flex h-full flex-col', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <NewProductFields />
          <AnalysisPrioritiesFields />
          <TargetMarketFields />
          <CompetingInformationFields />
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={!isValid || isSubmitting}
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-6 animate-spin" />
              <span>分析中です</span>
            </>
          ) : (
            <span>分析する</span>
          )}
        </Button>
      </form>
    </Form>
  );
}
