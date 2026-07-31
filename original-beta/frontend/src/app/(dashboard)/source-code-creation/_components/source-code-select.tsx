import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { languages } from '../_constant';

type LanguageSelectProps = {
  selectedLanguage: string;
  onLanguageChange: (value: string) => void;
};

export function LanguageSelect({ selectedLanguage, onLanguageChange }: LanguageSelectProps) {
  return (
    <Select value={selectedLanguage} onValueChange={onLanguageChange}>
      <SelectTrigger className="h-[30px] w-[200px]" size="sm">
        <SelectValue placeholder="開発言語" />
      </SelectTrigger>
      <SelectContent className="dark:bg-dark-gray rounded-md bg-white text-black shadow-md dark:text-white">
        {languages.map((language) => (
          <SelectItem key={language} value={language}>
            {language}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
