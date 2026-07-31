import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import FileDropArea from '@/app/_components/file-drop-area';
import { Spinner } from '@/app/_components/icon/decorative';
import { Form, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectTranscriptionHandwritten } from '@/app/_store/selectors/transcription-handwritten';
import {
  setTranscriptionHandwritten,
  setId,
  setResult,
} from '@/app/_store/slice/transcription-handwritten';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Button } from '../../../_components/ui/button';
import { transcriptionHandwritten } from '../_actions/transcriptionHandwritten';
import {
  ALLOWED_FILE_TYPES,
  transcriptionHandwrittenSchema,
  TranscriptionHandwrittenSchema,
} from '../_utils/schema';

type Props = {
  className?: string;
  setIsTranscriptionHandwritten: (isSubmitting: boolean) => void;
  switchLayout: (layout: LayoutType) => void;
};

export default function TranscriptionHandwrittenContentsForm({
  className,
  setIsTranscriptionHandwritten,
  switchLayout,
}: Props): JSX.Element {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, ...defaultValues } = useAppSelector(selectTranscriptionHandwritten);
  const form = useFormRedux<TranscriptionHandwrittenSchema>({
    resolver: zodResolver(transcriptionHandwrittenSchema),
    values: defaultValues,
    setRedux: setTranscriptionHandwritten,
  });

  const {
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = form;

  useEffect(() => {
    setIsTranscriptionHandwritten(isSubmitting);
  }, [isSubmitting]);

  const handleTranscriptionHandwrittenContentsSend = async (e: TranscriptionHandwrittenSchema) => {
    try {
      const formData = new FormData();
      for (const file of e.fileList) {
        formData.append('fileList', file);
      }
      const id = uniqueId();
      const response = await transcriptionHandwritten(id, formData);

      if (response.success) {
        const transcriptionHandwritten = response.content;
        dispatch(setResult({ result: transcriptionHandwritten, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
      }
    } catch (error) {
      console.error('Error transcription handwritten:', error);
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleTranscriptionHandwrittenContentsSend)}
        className={cn('relative flex h-full flex-col', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <FormItem>
            <RequiredLabel>文字起こしファイル</RequiredLabel>
            <FileDropArea
              name="fileList"
              setRedux={setTranscriptionHandwritten}
              accept={ALLOWED_FILE_TYPES}
            />
          </FormItem>
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
              <span>作成中です</span>
            </>
          ) : (
            <span>作成する</span>
          )}
        </Button>
      </form>
    </Form>
  );
}
