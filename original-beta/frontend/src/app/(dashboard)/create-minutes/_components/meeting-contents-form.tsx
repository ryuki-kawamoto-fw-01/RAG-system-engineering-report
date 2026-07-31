import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

import FileDropAreaWithTempStorage from '@/app/_components/file-drop-area-with-temp-storage';
import { Spinner } from '@/app/_components/icon/decorative';
import { Form, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectCreateMinutes } from '@/app/_store/selectors/create-minutes';
import { setCreateMinutes, setId, setResult } from '@/app/_store/slice/create-minutes';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Button } from '../../../_components/ui/button';
import { Textarea } from '../../../_components/ui/textarea';
import { createMinutes } from '../_actions/createMinutes';
import { ALLOWED_FILE_TYPES, createMinutesSchema, CreateMinutesSchema } from '../_utils/schema';

type Props = {
  className?: string;
  setIsCreatingMinutes: (isSubmitting: boolean) => void;
  switchLayout: (layout: LayoutType) => void;
};

export default function MeetingContentsForm({
  className,
  setIsCreatingMinutes,
  switchLayout,
}: Props): JSX.Element {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, ...defaultValues } = useAppSelector(selectCreateMinutes);
  const form = useFormRedux<CreateMinutesSchema>({
    resolver: zodResolver(createMinutesSchema),
    values: defaultValues,
    setRedux: setCreateMinutes,
  });

  const {
    control,
    handleSubmit,
    onChangeField,
    formState: { isValid, isSubmitting },
  } = form;

  useEffect(() => {
    setIsCreatingMinutes(isSubmitting);
  }, [isSubmitting, setIsCreatingMinutes]);

  const handleMeetingContentsSend = async (e: CreateMinutesSchema) => {
    try {
      const formData = new FormData();
      // fileListはFileReferenceの配列なのでJSON文字列として送信
      formData.append('fileList', JSON.stringify(e.fileList));
      formData.append('meetingPurpose', e.meetingPurpose!);
      const id = uniqueId();
      const response = await createMinutes(id, formData);

      if (response.success) {
        const createdMinutes = response.content;
        dispatch(setResult({ result: createdMinutes, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
      }
    } catch (error) {
      console.error('Error creating minutes:', error);
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleMeetingContentsSend)}
        className={cn('relative flex h-full flex-col', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <FormItem>
            <RequiredLabel>文字起こしファイル</RequiredLabel>
            <FileDropAreaWithTempStorage
              name="fileList"
              setRedux={setCreateMinutes}
              accept={ALLOWED_FILE_TYPES}
              uploadPrefix="temp/create_minutes"
            />
          </FormItem>

          <FormField
            control={control}
            name="meetingPurpose"
            render={({ field }) => (
              <FormItem>
                <OptionalLabel>
                  <span>会議の目的</span>
                </OptionalLabel>
                <Textarea
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onChangeField({
                      meetingPurpose: e.target.value,
                    });
                  }}
                  id="meetingPurpose"
                  className="min-h-[150px]"
                  placeholder={`会議の目的を入力してください（任意）\n例：新商品のアイディア出し`}
                />
                <FormMessage />
              </FormItem>
            )}
          />
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
