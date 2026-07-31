import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectFaqCreation } from '@/app/_store/selectors/faq-creation';
import { setFaqResult, updateFaqInput } from '@/app/_store/slice/faq-creation';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { createFaq } from '../_actions/createfaq';
import { faqcreationSchema, FaqcreationSchema, faqcreationFileSchema } from '../util/schema';
import FaqConsiderationForm from './faq-consideration-form';
import FaqCreateButton from './faq-create-button';
import FaqInputForm from './faq-input-form';
import QuestionerPositionForm from './questioner-position-form';
import RespondentPositionForm from './respondent-position-form';

type SelectTab = 'direct-input' | 'file-upload';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function FaqInputFormArea({ switchLayout, className }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const [selectedTab] = useState<SelectTab>('direct-input');
  const {
    text,
    documentType,
    checkpoints,
    additionalConsiderations,
    questionerPosition,
    respondentPosition,
  } = useAppSelector(selectFaqCreation);

  // 適切な初期値を設定して、必須フィールドに値を確実に提供する
  const defaultFormValues = {
    text: text || '',
    documentType: documentType || 'FAQ',
    checkpoints: checkpoints || ['一般的なFAQ'],
    additionalConsiderations: additionalConsiderations || '',
    questionerPosition: questionerPosition || '',
    respondentPosition: respondentPosition || '',
  };

  const form = useFormRedux<FaqcreationSchema>({
    resolver: zodResolver(
      selectedTab === 'file-upload' ? faqcreationFileSchema : faqcreationSchema
    ),
    values: defaultFormValues as FaqcreationSchema,
    mode: 'onChange',
    defaultValues: defaultFormValues as FaqcreationSchema,
  });

  // フォームの値が変更されたときにステートを更新
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.questionerPosition !== undefined || value.respondentPosition !== undefined) {
        dispatch(
          updateFaqInput({
            questionerPosition: value.questionerPosition || '',
            respondentPosition: value.respondentPosition || '',
          })
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [form, dispatch]);

  // リセットイベントのリスナーを追加
  useEffect(() => {
    const handleReset = () => {
      // フォームを完全にリセット
      form.reset({
        text: '',
        documentType: 'FAQ',
        checkpoints: ['一般的なFAQ'],
        additionalConsiderations: '', // 考慮事項を明示的に空にする
        questionerPosition: '',
        respondentPosition: '',
        fileList: undefined,
      });
    };

    // イベントリスナーを登録
    window.addEventListener('faq-form-reset', handleReset);

    // クリーンアップ
    return () => {
      window.removeEventListener('faq-form-reset', handleReset);
    };
  }, [form]);

  const onSubmit = async (data: FaqcreationSchema) => {
    try {
      // FormDataオブジェクトを作成
      const formData = new FormData();

      // データタイプに応じて処理を分ける
      if (selectedTab === 'file-upload' && data.fileList) {
        for (const file of data.fileList) {
          formData.append('fileList', file);
        }
      }

      // テキスト入力がある場合
      if (data.text) {
        formData.append('text', data.text);
      }

      // ドキュメント種類を指定
      formData.append('documentType', data.documentType || 'FAQ');

      // チェックポイント（質問者と回答者の立場）をカンマ区切りで追加
      const checkpoints = [];
      if (data.questionerPosition) {
        checkpoints.push(data.questionerPosition);
        formData.append('questionerPosition', data.questionerPosition);
      }
      if (data.respondentPosition) {
        checkpoints.push(data.respondentPosition);
        formData.append('respondentPosition', data.respondentPosition);
      }
      formData.append('checkpoints', checkpoints.join(','));
      if (data.additionalConsiderations) {
        formData.append('additionalConsiderations', data.additionalConsiderations);
      }
      const response = await createFaq(formData);

      if (response && response.success) {
        dispatch(setFaqResult(response.content || ''));

        // フォームの値をReduxに保存
        dispatch(
          updateFaqInput({
            text: data.text || '',
            documentType: data.documentType || 'FAQ',
            checkpoints,
            additionalConsiderations: data.additionalConsiderations || '',
            questionerPosition: data.questionerPosition || '',
            respondentPosition: data.respondentPosition || '',
          })
        );

        toast.success(getMessage('I_F_00030', 'FAQ'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(getMessage('E_F_00110', 'FAQ'));
      }
    } catch (error) {
      console.error('エラー詳細:', error);

      // エラーがJSON解析に関連するものかチェック
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        toast.error(
          'サーバーからの応答の解析に失敗しました。サーバー側で問題が発生している可能性があります。'
        );
      } else {
        toast.error(getMessage('E_F_00110', 'FAQ'));
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <FaqInputForm /> {/* ← onTabClick を削除 */}
          <QuestionerPositionForm />
          <RespondentPositionForm />
          <FaqConsiderationForm />
          <FaqCreateButton />
        </div>
      </form>
    </Form>
  );
}
