import React from 'react';
import { cn } from '@/app/_utils/tw-merge';

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function PageLayout({ children, className = '' }: Props) {
  return (
    <div className={cn('bg-slate-50 p-5 pt-3 size-full box-border flex flex-col', className)}>
      {children}
    </div>
  );
}
