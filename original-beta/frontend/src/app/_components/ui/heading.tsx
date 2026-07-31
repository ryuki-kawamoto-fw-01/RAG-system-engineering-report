import { cn } from '@/app/_utils/tw-merge';

type Props = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
};

export default function Heading({ level, children, className = '' }: Props) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const levelClassNames = {
    1: 'text-5xl leading-normal',
    2: 'text-3xl leading-normal',
    3: 'text-2xl leading-normal',
    4: 'text-xl leading-normal',
    5: 'text-base leading-normal',
    6: 'text-xs leading-normal',
  };

  return <Tag className={cn('font-bold', levelClassNames[level], className)}>{children}</Tag>;
}
