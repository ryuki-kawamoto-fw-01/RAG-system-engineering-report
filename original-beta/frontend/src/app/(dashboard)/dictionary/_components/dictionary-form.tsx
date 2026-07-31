import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import SvgAdd from '@/app/_components/icon/button/Add';
import SvgClose from '@/app/_components/icon/button/Close';
import { Button } from '@/app/_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import RequiredLabel from '@/app/_components/ui/required-label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { Textarea } from '@/app/_components/ui/textarea';
import { getMessage } from '@/app/_utils/message';
import { createDictionary } from '../_actions/createDictionary';
import { updateDictionary } from '../_actions/updateDictionary';
import { CATEGORY_OPTIONS } from '../_constant';
import { Dictionary } from '../_type';

type Props = {
  dictionary: Dictionary | null;
  handleClose: () => void;
};

// 登録できる用語は10個まで。統一名称を自動的に用語に含めるため、最大9個まで。
const MAX_TERM = 10;
const MAX_STRING_LENGTH = 100;
const MAX_TEXT_LENGTH = 200;

const customTermSchema = z.object({
  value: z.string().optional(),
});

const dictionarySchema = z
  .object({
    id: z.string(),
    uniform_name: z
      .string()
      .min(1, {
        message: '統一名称を入力してください',
      })
      .max(MAX_STRING_LENGTH, {
        message: `統一名称は${MAX_STRING_LENGTH}文字以内で入力してください`,
      }),
    category: z.string().min(1, {
      message: 'カテゴリーを選択してください',
    }),
    custom_terms: z
      .array(customTermSchema)
      .max(MAX_TERM - 1, `通称は最大${MAX_TERM - 1}個まで登録できます`),
    description: z
      .string()
      .min(1, {
        message: '説明を入力してください',
      })
      .max(MAX_TEXT_LENGTH, {
        message: `説明は${MAX_TEXT_LENGTH}文字以内で入力してください`,
      }),
  })
  .superRefine((data, ctx) => {
    const uniformName = data.uniform_name;

    const customTermValues = data.custom_terms
      .map((term) => term.value)
      .filter((val) => val !== '');

    data.custom_terms.forEach((term, index) => {
      if (term.value && term.value.length > MAX_STRING_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `通称は${MAX_STRING_LENGTH}文字以内で入力してください`,
          path: ['custom_terms', index, 'value'],
        });
      }
    });

    const allTerms = uniformName ? [uniformName, ...customTermValues] : customTermValues;

    if (allTerms.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '通称は1つ以上登録してください',
        path: ['custom_terms', 0, 'value'],
      });
    }

    if (allTerms.length > MAX_TERM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `登録できる通称は${MAX_TERM - 1}個までです`,
        path: ['custom_terms'],
      });
    }

    const newAllTerms = allTerms.filter((term) => term !== '');
    const uniqueAllTerms = new Set(newAllTerms);

    if (uniqueAllTerms.size !== newAllTerms.length) {
      const seen = new Set();

      if (uniformName && uniformName !== '') {
        seen.add(uniformName);
      }

      data.custom_terms.forEach((term, index) => {
        if (term.value && term.value !== '') {
          if (seen.has(term.value)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: '通称が重複しています',
              path: ['custom_terms', index, 'value'],
            });
          }
          seen.add(term.value);
        }
      });
    }
  });

type DictionaryForm = z.infer<typeof dictionarySchema>;

export default function DictionaryForm({ dictionary, handleClose }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<DictionaryForm>({
    resolver: zodResolver(dictionarySchema),
    defaultValues: {
      id: dictionary?.id || '',
      custom_terms: [{ value: '' }],
      uniform_name: dictionary?.uniform_name || '',
      category: dictionary?.category,
      description: dictionary?.description || '',
    },
  });

  const { control, handleSubmit, watch, setValue, setError, reset, trigger } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'custom_terms',
  });

  const uniformName = watch('uniform_name', '');

  useEffect(() => {
    if (document.activeElement && formRef.current?.contains(document.activeElement)) {
      trigger('custom_terms');
    }
  }, [uniformName, trigger]);

  useEffect(() => {
    if (!dictionary) return;

    const termsArray = dictionary.terms.split(',');
    const customTerms = termsArray
      .filter((term) => term !== dictionary.uniform_name && term.trim() !== '')
      .map((term) => ({ value: term }));

    const initialCustomTerms = customTerms.length > 0 ? customTerms : [{ value: '' }];

    reset({
      id: dictionary.id || '',
      category: isNew ? '' : dictionary.category,
      uniform_name: dictionary.uniform_name || '',
      description: dictionary.description || '',
      custom_terms: initialCustomTerms,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dictionary, reset, setValue]);

  if (dictionary === null) {
    return null;
  }

  const isNew = dictionary.id === null;
  const upsertLabel = isNew ? '登録' : '更新';

  const onSubmit = async (data: DictionaryForm) => {
    try {
      const formData = new FormData();
      formData.append('id', data.id);
      formData.append('category', data.category);
      formData.append('uniform_name', data.uniform_name);
      formData.append('description', data.description);

      const allTerms = [data.uniform_name, ...data.custom_terms.map((t) => t.value)].filter(
        (term) => term?.trim() !== ''
      );

      // 重複削除
      const uniqueTerms = [...new Set(allTerms)];

      uniqueTerms.forEach((term) => {
        if (term) {
          formData.append('terms', term);
        }
      });

      let res;
      if (isNew) {
        res = await createDictionary(formData);
      } else {
        res = await updateDictionary(formData, dictionary);
      }

      if (res.success) {
        toast.success(getMessage(isNew ? 'I_F_00160' : 'I_F_00170', '辞書'));
        router.refresh();
        handleClose();
      } else if (res.errors) {
        const serverErrors = res.errors;
        if (serverErrors.uniform_name) {
          setError('uniform_name', {
            type: 'server',
            message: serverErrors.uniform_name.join(', '),
          });
        }

        if (serverErrors.description) {
          setError('description', {
            type: 'server',
            message: serverErrors.description.join(', '),
          });
        }
      } else {
        toast.error(getMessage(isNew ? 'E_F_00390' : 'E_F_00400', '辞書'));
        router.refresh();
        handleClose();
      }
    } catch (error) {
      toast.error(getMessage(isNew ? 'E_F_00390' : 'E_F_00400', '辞書'));
      console.error(error);
    }
  };

  const handleAddTerm = () => {
    if (fields.length < MAX_TERM - 1) {
      append({ value: '' });
    }
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>辞書{upsertLabel}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="">
            <div className="flex flex-col gap-y-4">
              <FormField
                control={control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-x-3 space-y-0">
                    <RequiredLabel className="h-9 w-[108px] shrink-0 justify-between">
                      カテゴリー
                    </RequiredLabel>
                    <div className="w-full">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={isNew ? '' : field.value!}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {CATEGORY_OPTIONS.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="mt-1" />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                name="id"
                control={control}
                render={({ field }) => <Input type="hidden" {...field} />}
              />

              <FormField
                name="uniform_name"
                control={control}
                render={({ field }) => (
                  <FormItem className="flex items-start gap-x-3 space-y-0">
                    <RequiredLabel className="h-9 w-[108px] shrink-0 justify-between">
                      統一名称
                    </RequiredLabel>
                    <div className="w-full">
                      <FormControl>
                        <Input className="w-full" type="text" {...field} />
                      </FormControl>
                      <FormMessage className="mt-1" />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                name="custom_terms"
                control={control}
                render={() => (
                  <FormItem className="flex items-start gap-x-3 space-y-0">
                    <RequiredLabel className="h-9 w-[108px] shrink-0 justify-between">
                      通称
                    </RequiredLabel>
                    <div className="w-full">
                      <div className="flex flex-col gap-y-3">
                        <FormControl>
                          <Input
                            type="text"
                            value={uniformName}
                            readOnly
                            className="w-full opacity-50"
                          />
                        </FormControl>

                        {fields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-3">
                            <div className="flex-1">
                              <FormField
                                name={`custom_terms.${index}.value`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <FormItem>
                                    <div className="flex items-center">
                                      <FormControl>
                                        <Input
                                          type="text"
                                          className={`w-full ${fieldState.invalid ? 'border-red-600 bg-red-50' : ''}`}
                                          {...field}
                                        />
                                      </FormControl>
                                      {fields.length >= 1 && (
                                        <div className="ml-3 shrink-0">
                                          <SvgClose
                                            onClick={() => remove(index)}
                                            className="size-4 cursor-pointer"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <FormMessage className="mt-1" />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {fields.length < MAX_TERM - 1 && (
                <div className="-mt-1 grid grid-cols-10">
                  <div className="col-span-1" />
                  <div className="col-span-9 flex justify-center">
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      className="flex gap-x-1"
                      onClick={handleAddTerm}
                    >
                      <SvgAdd className="size-4" />
                      通称を追加
                    </Button>
                  </div>
                </div>
              )}

              <FormField
                name="description"
                control={control}
                render={({ field }) => (
                  <FormItem className="flex items-start gap-x-3 space-y-0">
                    <RequiredLabel className="h-9 w-[108px] shrink-0 justify-between">
                      説明
                    </RequiredLabel>
                    <div className="w-full">
                      <FormControl>
                        <Textarea
                          showCounter
                          maxLength={MAX_TEXT_LENGTH}
                          className="w-full resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="mt-1" />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button variant="tertiary" className="w-[120px]" onClick={() => handleClose()}>
                キャンセル
              </Button>
              <Button type="submit" variant="secondary" className="w-[120px]">
                設定する
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
