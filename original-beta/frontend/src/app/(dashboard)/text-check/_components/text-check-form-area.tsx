'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { selectTextCheck } from '@/app/_store/selectors/text-check';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult, setId } from '../../../_store/slice/text-check';
import { textCheck } from '../_actions/textCheck';
import { TextCheckSchema, textCheckTextSchema, textCheckFileSchema } from '../_utils/schema';
import CheckContentForm from './check-content-form';
import TextCheckButton from './text-check-button';
import TextInputForm from './text-input-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function TextCheckFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { evaluation, correctedText, ...defaultValues } = useAppSelector(selectTextCheck);
  const [selectedTab, setSelectedTab] = useState<'form-input' | 'file-upload'>('form-input');
  const dispatch = useAppDispatch();
  const form = useFormRedux<TextCheckSchema>({
    resolver: zodResolver(selectedTab === 'form-input' ? textCheckTextSchema : textCheckFileSchema),
    values: defaultValues as TextCheckSchema,
  });

  const handleTextCheck = async (e: TextCheckSchema) => {
    try {
      const formData = new FormData();
      if (selectedTab === 'file-upload' && 'fileList' in e && e.fileList) {
        const fileReferences =
          e.fileList instanceof FileList
            ? Array.from(e.fileList).map((file) => ({
                name: file.name,
                type: file.type,
                size: file.size,
              }))
            : e.fileList;
        formData.append('fileList', JSON.stringify(fileReferences));
      }
      if (selectedTab === 'form-input' && 'text' in e) {
        formData.append('textInput', e.text);
      }
      formData.append('checkContent1', e.content1);
      if (e.content2) {
        formData.append('checkContent2', e.content2);
      }
      if (e.content3) {
        formData.append('checkContent3', e.content3);
      }

      const id = uniqueId();
      const response = await textCheck(id, formData, selectedTab);

      if ('error' in response) {
        toast.error(<ReactMarkdown>{response.error}</ReactMarkdown>);
      } else {
        dispatch(
          setResult({
            evaluation: response.evaluation,
            correctedText: response.correctedText,
            feedbackAt: undefined,
          })
        );
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);

        return response;
      }
    } catch {
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleTextCheck)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 文章入力フォーム */}
          <TextInputForm onTabClick={(v) => setSelectedTab(v)} />
          {/* 文章確認内容入力フォーム */}
          <CheckContentForm />
          {/* 文章の指摘実行ボタン */}
          <TextCheckButton selectedTab={selectedTab} />
        </div>
      </form>
    </Form>
  );
}
