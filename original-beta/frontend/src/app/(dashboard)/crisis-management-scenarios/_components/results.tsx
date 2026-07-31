import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult } from '../../../_store/slice/crisis-management-scenarios';
import { NewCrisisManagementScenarios } from '../_actions/new-crisis-management-scenarios';
import {
  NewCrisisManagementScenariosSchema,
  newCrisisManagementScenariosSchema,
} from '../_utils/schema';
import RequestForm from './crisis-management-scenarios-request-form';
import ResultArea from './result-area';

type Props = {
  className?: string;
};

export default function Results({ className }: Props) {
  const { newRequest, result, feedbackAt } = useAppSelector(
    (state) => state.crisisManagementScenarios
  );
  const dispatch = useAppDispatch();

  const form = useFormRedux<NewCrisisManagementScenariosSchema>({
    resolver: zodResolver(newCrisisManagementScenariosSchema),
    values: {
      newRequest,
      result,
    } as NewCrisisManagementScenariosSchema,
  });

  const handleNewCrisisManagementScenarios = async (e: NewCrisisManagementScenariosSchema) => {
    try {
      if (!e.result) {
        console.error('結果が空です');
        toast.error('現在の危機管理シナリオが空のため、追加リクエストを実行できません');
        return;
      }
      const response = await NewCrisisManagementScenarios(e.result, e.newRequest!);

      if ('error' in response) {
        toast.error(response.error);
        return;
      }

      if (!response.answer) {
        console.error('応答内容が空です:', response);
        toast.error('空の応答が返されました');
        return;
      }

      // 再作成時は既存のフィードバック状態を維持する
      dispatch(setResult({ result: response.answer, feedbackAt }));
      toast.success(getMessage('I_F_00040', '作成結果'));
      return response;
    } catch (error) {
      console.error('危機管理シナリオの追加リクエストエラー:', error);
      toast.error('危機管理シナリオの追加に失敗しました');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleNewCrisisManagementScenarios)}
        className={cn('size-full flex flex-col relative', className)}
      >
        <div className="h-full overflow-y-auto">
          <div className="flex h-full flex-col">
            {/* 作成結果エリア */}
            <ResultArea className="mb-3 flex grow flex-col" />
            {/* 結果を調整するエリア */}
            <RequestForm className="flex flex-col" />
          </div>
        </div>
      </form>
    </Form>
  );
}
