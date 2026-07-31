import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../_components/ui/select';
import { industries } from '../_constant';

type IndustrySelectProps = {
  selectedIndustry: string;
  onIndustryChange: (value: string) => void;
};

export function IndustrySelect({ selectedIndustry, onIndustryChange }: IndustrySelectProps) {
  return (
    <Select value={selectedIndustry} onValueChange={onIndustryChange}>
      <SelectTrigger className="h-[30px] w-[200px]" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="dark:bg-dark-gray rounded-md bg-white text-black shadow-md dark:text-white">
        {industries.map((industry) => (
          <SelectItem key={industry} value={industry}>
            {industry}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
