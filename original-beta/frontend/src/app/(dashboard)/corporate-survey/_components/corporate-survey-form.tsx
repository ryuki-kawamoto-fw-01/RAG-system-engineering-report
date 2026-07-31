import { UseFormReturn } from 'react-hook-form';
import { Form } from '@/app/_components/ui/form';
import { cn } from '@/app/_utils/tw-merge';
import { CorporateSurvey } from '../_type';
import AdditionalInformationArea from './additional-information-area';
import CompanyNameInputArea from './company-name-input-area';
import SubmitButton from './submit-button';
import SurveyItemsCheckArea from './survey-items-check-area';

type Props = {
  form: UseFormReturn<CorporateSurvey>;
  onSubmit: (data: CorporateSurvey) => void;
  className?: string;
};

export default function CorporateSurveyForm({ form, onSubmit, className }: Props): JSX.Element {
  const {
    control,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = form;
  const surveyCompany = watch('surveyCompany', '');
  const selectedOptions = watch('selectedOptions', []);

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn('flex flex-col h-full relative', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <CompanyNameInputArea control={control} />
          <SurveyItemsCheckArea control={control} />
          <AdditionalInformationArea control={control} />
          <SubmitButton
            isLoading={isSubmitting}
            isDisabled={!surveyCompany.trim() || !selectedOptions.length || isSubmitting}
            className="shrink-0"
          />
        </div>
      </form>
    </Form>
  );
}
