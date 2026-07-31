import SvgArrowRight from '@/app/_components/icon/button/ArrowRight';
import { Spinner } from '@/app/_components/icon/decorative';
import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { useAppSelector } from '@/app/_store/hooks';
import { setTranslation } from '@/app/_store/slice/translation';
import { cn } from '@/app/_utils/tw-merge';
import { languages } from '../../../../../config';
import { Button } from '../../../_components/ui/button';
import { Textarea } from '../../../_components/ui/textarea';
import { TranslationSchema } from '../_utils/schema';
import { LanguageSelect } from './LanguageSelect';

type Props = {
  className?: string;
};

export function TranslationForm({ className }: Props) {
  const {
    onChangeField,
    control,
    formState: { isValid, isSubmitting },
  } = useFormReduxContext<TranslationSchema>({
    setRedux: setTranslation,
  });
  const { result } = useAppSelector((state) => state.translation);

  return (
    <div className={cn('flex h-full flex-col relative', className)}>
      <div className="h-full space-y-3 overflow-y-auto pb-[48px]">
        <FormItem>
          <RequiredLabel>言語</RequiredLabel>
          <div className="flex items-center gap-x-2">
            <FormField
              control={control}
              name="sourceLanguage"
              render={({ field }) => (
                <LanguageSelect
                  languages={languages}
                  value={field.value!}
                  onValueChange={(e) => {
                    onChangeField({ sourceLanguage: e });
                  }}
                  placeholder="自動検出"
                  includeAutoDetect
                />
              )}
            />
            <div className="shrink-0">
              <SvgArrowRight className="size-4" />
            </div>
            <FormField
              control={control}
              name="targetLanguage"
              render={({ field }) => (
                <LanguageSelect
                  languages={languages}
                  value={field.value!}
                  onValueChange={(e) => {
                    onChangeField({ targetLanguage: e });
                  }}
                  placeholder="自動検出"
                  includeAutoDetect
                />
              )}
            />
          </div>
        </FormItem>
        <FormField
          control={control}
          name="inputText"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>翻訳したい文章</RequiredLabel>
              <Textarea
                {...field}
                onKeyUp={(e) => {
                  onChangeField({ inputText: (e.target as HTMLTextAreaElement).value });
                }}
                className="min-h-[400px]"
                showCounter
              />
            </FormItem>
          )}
        />
        {result && (
          <FormField
            control={control}
            name="considerations"
            render={({ field }) => (
              <FormItem>
                <OptionalLabel>翻訳結果の調整</OptionalLabel>
                <Textarea
                  {...field}
                  onKeyUp={(e) => {
                    onChangeField({ considerations: (e.target as HTMLTextAreaElement).value });
                  }}
                  className="min-h-[150px]"
                  placeholder="追加の指示を入力してください"
                />
              </FormItem>
            )}
          />
        )}
        <Button
          type="submit"
          variant="secondary"
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-6 animate-spin" />
              翻訳中です
            </>
          ) : result ? (
            '再翻訳する'
          ) : (
            '翻訳する'
          )}
        </Button>
      </div>
    </div>
  );
}
