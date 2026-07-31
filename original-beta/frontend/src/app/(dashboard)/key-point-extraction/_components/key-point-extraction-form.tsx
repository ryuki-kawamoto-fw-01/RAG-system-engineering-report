// 設定エリア
import { zodResolver } from '@hookform/resolvers/zod';

import { JSX, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectKeyPointExtraction } from '@/app/_store/selectors/key-point-extraction';
import { setResult, setId } from '@/app/_store/slice/key-point-extraction';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { keyPointExtraction } from '../_actions/keyPointExtraction';
import {
  keyPointExtractionSchema,
  KeyPointExtractionSchema,
  keyPointExtractionFileSchema,
} from '../_utils/schema';
import AdditionalConsiderationsArea from './additional-considerations-area';
import TextInputArea, { SelectTab } from './key-point-extraction-area';
import SubmitButton from './submit-button';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function KeyPointExtractionForm({ switchLayout, className }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const [selectedTab, setSelectedTab] = useState<SelectTab>('direct-input');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { keyPointExtractionResult, ...defaultValues } = useAppSelector(selectKeyPointExtraction);
  const form = useFormRedux<KeyPointExtractionSchema>({
    resolver: zodResolver(
      selectedTab === 'file-upload' ? keyPointExtractionFileSchema : keyPointExtractionSchema
    ),
    values: defaultValues as KeyPointExtractionSchema,
  });

  const onSubmit = async (e: KeyPointExtractionSchema) => {
    try {
      const formData = new FormData();
      if (selectedTab === 'file-upload') {
        // FileReference[]をJSON文字列化して送信
        formData.append('fileList', JSON.stringify(e.fileList));
      }
      if (selectedTab === 'direct-input') {
        formData.append('text', e.text);
      }
      formData.append('additionalConsiderations', e.additionalConsiderations!);
      const id = uniqueId();
      const response = await keyPointExtraction(id, formData, selectedTab);

      // 成功時の処理
      if (response.success) {
        dispatch(setId(id));
        dispatch(
          setResult({
            keyPointExtractionResult: response.key_point_extraction_result.replace(/\\n/g, '\n'),
            feedbackAt: undefined,
          })
        );

        toast.success(getMessage('I_F_00030', '要点抽出結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
      }
    } catch {
      toast.error(getMessage('E_F_00110', '要点抽出結果'));
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
          {/* 考慮事項エリア */}
          <AdditionalConsiderationsArea />
          {/* 開始ボタンエリア */}
          <SubmitButton selectedTab={selectedTab} />
        </div>
      </form>
    </Form>
  );
}
