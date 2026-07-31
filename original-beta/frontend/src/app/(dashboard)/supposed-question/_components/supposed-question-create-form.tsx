'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

import FileDropAreaWithTempStorage from '@/app/_components/file-drop-area-with-temp-storage';

import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { Form, FormField, FormItem } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Slider } from '@/app/_components/ui/slider';
import { Textarea } from '@/app/_components/ui/textarea';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectSupposedQuestion } from '@/app/_store/selectors/supposed-question';
import { setResult, setSupposedQuestion, setId } from '@/app/_store/slice/supposed-question';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createSupposedQuestion } from '../_actions/createSupposedQuestion';
import { supposedQuestionSchema, SupposedQuestionSchema } from '../_utils/schema';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
};

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function SupposedQuestionCreateForm({ switchLayout, className = '' }: Props) {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, temp_file, modified, ...defaultValues } = useAppSelector(selectSupposedQuestion);
  const { onChangeField, ...form } = useFormRedux<SupposedQuestionSchema>({
    resolver: zodResolver(supposedQuestionSchema),
    values: defaultValues,
    setRedux: setSupposedQuestion,
  });
  const { isSubmitting, isValid } = form.formState;

  const handleSubmit = async (e: SupposedQuestionSchema) => {
    try {
      const formData = new FormData();
      // fileはRedux stateに保存されたFileReferenceの配列
      const fileReferences = defaultValues.file; // すでにアップロード済みのFileReference[]
      formData.append('file', JSON.stringify(fileReferences));
      formData.append('description', String(e.description));
      formData.append('specialty', String(e.specialty));
      formData.append('interest', String(e.interest));
      formData.append('intimacy', String(e.intimacy));
      formData.append('consideration', String(e.consideration));

      const id = uniqueId();
      const res = await createSupposedQuestion(id, formData);
      if (res.success) {
        dispatch(
          setResult({
            result: res.content ?? '',
            temp_file: res.temp_file ?? '',
            feedbackAt: undefined,
          })
        );
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(<ReactMarkdown>{res.message}</ReactMarkdown>);
      }
    } catch (error) {
      console.error('Error creating supposed question:', error);
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn('flex flex-col h-full relative', className)}
      >
        <div className="h-full space-y-3 overflow-y-auto pb-[48px]">
          <FormItem>
            <RequiredLabel>説明資料</RequiredLabel>
            <FileDropAreaWithTempStorage
              name="file"
              accept={ACCEPTED_FILE_TYPES}
              setRedux={setSupposedQuestion}
              uploadPrefix="temp/supposed_question"
            />
          </FormItem>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel>説明の目的</RequiredLabel>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onChangeField({ description: e.target.value });
                  }}
                  name="description"
                  placeholder="例：新システム導入の提案"
                />
              </FormItem>
            )}
          />
          <FormItem>
            <RequiredLabel>説明相手の特徴</RequiredLabel>
            <div className="space-y-1.5">
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <span className="w-14 text-base">専門性</span>
                    <Slider
                      max={100}
                      step={1}
                      onValueChange={(value: number[]) => onChangeField({ specialty: value[0] })}
                      value={[field.value!]}
                      className="outline-none"
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interest"
                render={({ field }) => (
                  <FormItem>
                    <span className="w-14 text-base">興味</span>
                    <Slider
                      max={100}
                      step={1}
                      onValueChange={(value: number[]) => onChangeField({ interest: value[0] })}
                      value={[field.value!]}
                      className="outline-none"
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="intimacy"
                render={({ field }) => (
                  <FormItem>
                    <span className="w-14 text-base">親密度</span>
                    <Slider
                      max={100}
                      step={1}
                      onValueChange={(value: number[]) => onChangeField({ intimacy: value[0] })}
                      value={[field.value!]}
                      className="outline-none"
                    />
                  </FormItem>
                )}
              />
            </div>
          </FormItem>
          <div>
            <FormField
              control={form.control}
              name="consideration"
              render={({ field }) => (
                <FormItem>
                  <OptionalLabel>考慮事項</OptionalLabel>
                  <Textarea
                    {...field}
                    onKeyUp={(e) => {
                      onChangeField({ consideration: (e.target as HTMLTextAreaElement).value });
                    }}
                    name="consideration"
                    placeholder="例：初回提案の顧客を想定、質問は10個以内にまとめる"
                    rows={3}
                    className="min-h-[150px]"
                  />
                </FormItem>
              )}
            />
          </div>
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
