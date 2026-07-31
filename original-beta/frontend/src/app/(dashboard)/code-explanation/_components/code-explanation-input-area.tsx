import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setId, setResult } from '@/app/_store/slice/code-explanation';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createCodeExplanation } from '../_actions/code-explanation';
import { codeExplanationSchema, CodeExplanationSchema } from '../_utils/schema';
import CodeInputArea from './code-input-area';
import ProgrammingLanguageInputArea from './programming-languagge-input-area';
import SubmitButton from './submit-button';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function CodeExplanationInputArea({ className, switchLayout }: Props): JSX.Element {
  const { programmingLanguage, code } = useAppSelector((state) => state.codeExplanation);

  // inputがundefinedの場合のフォールバック
  const defaultFormValues = {
    programmingLanguage: programmingLanguage || '',
    code: code || '',
  };

  const form = useFormRedux<CodeExplanationSchema>({
    resolver: zodResolver(codeExplanationSchema),
    values: defaultFormValues,
    mode: 'onChange',
    defaultValues: defaultFormValues,
  });

  const dispatch = useAppDispatch();

  const onSubmit = async (e: CodeExplanationSchema) => {
    try {
      const id = uniqueId();
      const response = await createCodeExplanation(id, e.programmingLanguage, e.code);
      if (response.success) {
        dispatch(setResult(response.result));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00100', 'コードの解説'));
        // レイアウト切り替え
        switchLayout(LAYOUT_RIGHT_ONLY);
      }
      if ('error' in response) {
        toast.error(response.error);
      }
    } catch (error) {
      console.error('Error creating JSON data:', error);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* プログラミング言語または製品名を入力するエリア*/}
          <ProgrammingLanguageInputArea />
          {/* コードを入力するエリア */}
          <CodeInputArea />

          {/* 作成開始ボタンエリア */}

          <SubmitButton />
        </div>
      </form>
    </Form>
  );
}
