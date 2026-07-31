'use client';

import * as React from 'react';

import SvgCheck from '@/app/_components/icon/decorative/Check';
import { Select, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { cn } from '@/app/_utils/tw-merge';
import { Button } from '../../../../_components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from '../../../../_components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../_components/ui/popover';
import { categories } from '../../../../_constants/document-register';

type CategorySelectorButtonProps = {
  onCategoryChange: (selectedCategory: string | null) => void;
};

export default function CategorySelectorButton({ onCategoryChange }: CategorySelectorButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState<string | null>(null);

  const handleSelect = (currentLabel: string) => {
    const category = categories.find((c) => c.label === currentLabel);
    const newValue =
      category && category.value === selectedValue ? null : (category?.value ?? null);
    setSelectedValue(newValue);
    onCategoryChange(newValue);
    setOpen(false);
  };

  const buttonText =
    selectedValue === null
      ? '「全てのフォルダ」を検索'
      : `「${categories.find((c) => c.value === selectedValue)?.label}」を検索`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" role="combobox" aria-expanded={open} className="my-1 has-[svg]:p-0">
          <Select>
            <SelectTrigger className="font-base w-60 font-normal">
              <SelectValue placeholder={buttonText} />
            </SelectTrigger>
          </Select>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 rounded-lg bg-white p-0 shadow-focus">
        <Command>
          <CommandInput placeholder="フォルダ名を検索" className="h-10" />
          <CommandList className="px-2 py-1">
            <CommandEmpty>フォルダが見つかりません。</CommandEmpty>
            <CommandGroup className="p-0">
              {categories.map((category) => (
                <CommandItem
                  key={category.value}
                  value={category.label}
                  onSelect={handleSelect}
                  className=" flex h-8 items-center gap-x-2 px-1 text-base"
                >
                  <SvgCheck
                    className={cn(
                      'size-4 text-sky-650',
                      selectedValue === category.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {category.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
