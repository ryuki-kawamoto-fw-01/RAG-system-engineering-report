import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/app/_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
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
import { createUseCase } from '../_actions/createUseCase';
import { updateUseCase } from '../_actions/updateUseCase';
import {
  STATUS_VALUES,
  VALUE_PROPOSITION_VALUES,
  BUSINESS_DOMAIN_VALUES,
  CATEGORY_VALUES,
  CLASSIFICATION_VALUES,
  ORIGIN_VALUES,
  DEVELOPMENT_DEPARTMENT_VALUES,
} from '../_constant';
import { UseCase } from '../_type';
import { USE_CASE_NAME_MAX_LENGTH, OVERVIEW_MAX_LENGTH, UseCaseSchema } from '../_utils/schema';

type Props = {
  useCase: UseCase | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function UseCasesForm({ useCase, onClose, onSuccess }: Props) {
  const form = useForm<z.infer<typeof UseCaseSchema>>({
    resolver: zodResolver(UseCaseSchema),
    defaultValues: {
      status: useCase?.status || '',
      value_proposition: useCase?.value_proposition || '',
      business_domain: useCase?.business_domain || '',
      category: useCase?.category || '',
      classification: useCase?.classification || '',
      use_case_name: useCase?.use_case_name || '',
      overview: useCase?.overview || '',
      origin: useCase?.origin || '',
      development_department: useCase?.development_department || '',
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isLoading },
    reset,
  } = form;

  React.useEffect(() => {
    if (useCase) {
      reset({
        status: useCase.status,
        value_proposition: useCase.value_proposition,
        business_domain: useCase.business_domain,
        category: useCase.category,
        classification: useCase.classification,
        use_case_name: useCase.use_case_name,
        overview: useCase.overview,
        origin: useCase.origin,
        development_department: useCase.development_department,
      });
    }
  }, [useCase, reset]);

  if (useCase === null) {
    return null;
  }

  const isNew = useCase.id === null;
  const upsertLabel = isNew ? '登録' : '更新';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSubmit = async (data: z.infer<typeof UseCaseSchema>) => {
    try {
      let res;
      if (isNew) {
        res = await createUseCase(data);
      } else {
        res = await updateUseCase(data, useCase);
      }

      if (res.success) {
        toast.success(getMessage(isNew ? 'I_F_00160' : 'I_F_00170', 'ユースケース'));
        onSuccess();
      } else {
        toast.error(getMessage(isNew ? 'E_F_00390' : 'E_F_00400', 'ユースケース'));
      }
    } catch {
      toast.error(getMessage(isNew ? 'E_F_00390' : 'E_F_00400', 'ユースケース'));
    }
  };
  const handleCloseClick = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={handleCloseClick}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{upsertLabel}：ユースケース</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>ステータス</RequiredLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="ステータスを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {STATUS_VALUES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="value_proposition"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>提供価値</RequiredLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="提供価値を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {VALUE_PROPOSITION_VALUES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="business_domain"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>業務領域</RequiredLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="業務領域を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {BUSINESS_DOMAIN_VALUES.map((domain) => (
                            <SelectItem key={domain} value={domain}>
                              {domain}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>カテゴリー</RequiredLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリーを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {CATEGORY_VALUES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="classification"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>区分</RequiredLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="区分を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CLASSIFICATION_VALUES.map((classification) => (
                          <SelectItem key={classification} value={classification}>
                            {classification}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="use_case_name"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>
                    ユースケース名（{USE_CASE_NAME_MAX_LENGTH}文字以内）
                  </RequiredLabel>
                  <Input {...field} placeholder="ユースケース名を入力" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="overview"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>概要（{OVERVIEW_MAX_LENGTH}文字以内）</RequiredLabel>
                  <Textarea {...field} placeholder="概要を入力" className="min-h-[120px]" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>検討元</RequiredLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="検討元を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {ORIGIN_VALUES.map((origin) => (
                            <SelectItem key={origin} value={origin}>
                              {origin}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="development_department"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>開発部署</RequiredLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="開発部署を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {DEVELOPMENT_DEPARTMENT_VALUES.map((department) => (
                            <SelectItem key={department} value={department}>
                              {department}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseClick}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {upsertLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
