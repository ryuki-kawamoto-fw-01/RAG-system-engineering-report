import { cn } from '@/app/_utils/tw-merge';

type HistoryLayoutProps = {
  children: React.ReactNode;
  className?: string;
};
function HistoryLayout({ children, className }: HistoryLayoutProps) {
  return (
    <div
      className={cn('flex w-[210px] min-w-[210px] flex-col space-y-1.5 bg-white p-2', className)}
    >
      {children}
    </div>
  );
}

type HistoryHeaderProps = {
  children: React.ReactNode;
  className?: string;
};
function HistoryHeader({ children, className }: HistoryHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-x-1', className)}>{children}</div>
  );
}

type HistoryContentProps = {
  children: React.ReactNode;
  className?: string;
};
function HistoryContent({ children, className }: HistoryContentProps) {
  return <div className={cn('flex-1 flex flex-col min-h-0', className)}>{children}</div>;
}

type HistoryTitleProps = {
  children: React.ReactNode;
  className?: string;
};
function HistoryTitle({ children, className }: HistoryTitleProps) {
  return <div className={cn('text-xs font-bold text-neutral-400', className)}>{children}</div>;
}

export { HistoryLayout, HistoryHeader, HistoryContent, HistoryTitle };
