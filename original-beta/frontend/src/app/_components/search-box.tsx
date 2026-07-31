import { VariantProps } from 'class-variance-authority';
import { cn } from '../_utils/tw-merge';
import SvgSearch from './icon/button/Search';
import { Input, inputVariants } from './ui/input';

type Props = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants> & {
    className?: string;
  };

export default function SearchBox({ className = '', ...props }: Props) {
  return (
    <div className="relative flex items-center">
      <SvgSearch className="absolute left-2 size-6 text-neutral-300" />
      <Input type="text" className={cn('p-2 pl-9', className)} {...props} />
    </div>
  );
}
