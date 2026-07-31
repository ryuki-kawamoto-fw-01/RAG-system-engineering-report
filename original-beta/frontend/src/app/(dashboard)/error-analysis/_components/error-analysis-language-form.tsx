import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setErrorAnalysis } from '@/app/_store/slice/error-analysis';
import { CreateErrorAnalysisSchema } from '../_utils/schema';

const programmingLanguages = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'C#',
  'C++',
  'C',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'Swift',
  'Kotlin',
  'その他',
];

export default function ErrorAnalysisLanguageForm() {
  const { onChangeField, control } = useFormReduxContext<CreateErrorAnalysisSchema>({
    setRedux: setErrorAnalysis,
  });

  return (
    <div>
      <FormField
        control={control}
        name="programmingLanguage"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>プログラミング言語</RequiredLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                onChangeField({ programmingLanguage: value });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="プログラミング言語を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {programmingLanguages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
}
