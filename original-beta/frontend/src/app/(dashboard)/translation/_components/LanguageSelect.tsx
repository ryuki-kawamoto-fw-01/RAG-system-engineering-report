import { Check, ChevronDown } from 'lucide-react';
import { Button } from '../../../_components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../../../_components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../_components/ui/popover';
import { cn } from '../../../_utils/tw-merge';

interface Language {
  value: string;
  label: string;
}

interface LanguageSelectProps {
  languages: Language[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  includeAutoDetect?: boolean;
}

export function LanguageSelect({
  languages,
  value,
  onValueChange,
  placeholder,
  includeAutoDetect = false,
}: LanguageSelectProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="dropdown"
          className="w-[200px] justify-between bg-white !pr-[8px] text-sm font-normal"
        >
          {value
            ? languages.find((language) => language.value === value)?.label ||
              (includeAutoDetect && value === 'auto' ? '自動検出' : placeholder)
            : placeholder}
          <ChevronDown className="ml-2 size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] bg-white p-0">
        <Command>
          <CommandInput placeholder="言語を検索..." />
          <CommandEmpty>言語が見つかりません。</CommandEmpty>
          <CommandGroup>
            {includeAutoDetect && (
              <CommandItem onSelect={() => onValueChange('auto')}>
                <Check
                  className={cn('mr-2 h-4 w-4', value === 'auto' ? 'opacity-100' : 'opacity-0')}
                />
                自動検出
              </CommandItem>
            )}
            {languages.map((language) => (
              <CommandItem key={language.value} onSelect={() => onValueChange(language.value)}>
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    language.value === value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {language.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
