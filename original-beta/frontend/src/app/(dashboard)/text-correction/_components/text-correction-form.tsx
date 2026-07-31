// 文章校正設定エリア
import { zodResolver } from '@hookform/resolvers/zod';

import { JSX, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectTextCorrection } from '@/app/_store/selectors/text-correction';
import { setResult, setId } from '@/app/_store/slice/text-correction';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { textCorrection } from '../_actions/textCorrection';
import {
  textCorrectionSchema,
  TextCorrectionSchema,
  textCorrectionFileSchema,
  TextCorrectionTextSchema,
  TextCorrectionFileSchema,
} from '../_utils/schema';
import AdditionalConsiderationsArea from './additional-considerations-area';
import CheckpointsArea from './checkpoints-area';
import DocumentTypeArea from './document-type-area';
import SubmitButton from './submit-button';
import TextInputArea, { SelectTab } from './text-input-area';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function TextCorrectionForm({ switchLayout, className }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const [selectedTab, setSelectedTab] = useState<SelectTab>('direct-input');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pointsOfCriticism, originalText, correctedText, ...defaultValues } =
    useAppSelector(selectTextCorrection);
  const form = useFormRedux<TextCorrectionSchema>({
    resolver: zodResolver(
      selectedTab === 'file-upload' ? textCorrectionFileSchema : textCorrectionSchema
    ),
    values: defaultValues,
  });

  const onSubmit = async (e: TextCorrectionSchema) => {
    try {
      const formData = new FormData();
      if (selectedTab === 'file-upload') {
        const fileData = e as TextCorrectionFileSchema;
        if (fileData.fileList) {
          // fileListはFileReferenceの配列なのでJSON文字列として送信
          formData.append('fileList', JSON.stringify(fileData.fileList));
        }
      }
      if (selectedTab === 'direct-input') {
        const textData = e as TextCorrectionTextSchema;
        formData.append('text', textData.text);
      }
      formData.append('documentType', e.documentType);
      formData.append('checkpoints', e.checkpoints.join(','));
      formData.append('additionalConsiderations', e.additionalConsiderations!);
      const id = uniqueId();
      const response = await textCorrection(id, formData, selectedTab);

      // 成功時の処理
      if (response.success) {
        dispatch(setId(id));
        dispatch(
          setResult({
            pointsOfCriticism: response.points_of_criticism.replace(/\\n/g, '\n'),
            originalText: response.original_text,
            correctedText: response.corrected_text.replace(/\\n/g, '\n'),
          })
        );

        toast.success(getMessage('I_F_00030', '校正結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
      }
    } catch (error) {
      console.error('Error text correction:', error);
      toast.error(getMessage('E_F_00110', '校正結果'));
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('h-full flex flex-col relative', className)}
      >
        <div className="h-full space-y-3 overflow-y-auto pb-[48px]">
          {/* 文章入力エリア */}
          <TextInputArea onTabClick={(v) => setSelectedTab(v)} />
          {/* 文章用途エリア */}
          <DocumentTypeArea />
          {/* チェック観点エリア */}
          <CheckpointsArea />
          {/* 校正の考慮事項を追加するエリア */}
          <AdditionalConsiderationsArea />
          {/* 校正開始ボタンエリア */}
          <SubmitButton selectedTab={selectedTab} />
        </div>
      </form>
    </Form>
  );
}
