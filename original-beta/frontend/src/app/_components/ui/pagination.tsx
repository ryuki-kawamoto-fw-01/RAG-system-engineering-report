import * as React from 'react';

import { cn } from '../../_utils/tw-merge';
import SvgChevronLeft from '../icon/button/ChevronLeft';
import SvgChevronRight from '../icon/button/ChevronRight';
import SvgEllipsis from '../icon/button/Ellipsis';

function PaginationContainer({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}
PaginationContainer.displayName = 'Pagination';

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-row items-center gap-2', className)} {...props} />
  )
);
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(
  ({ className, ...props }, ref) => <li ref={ref} className={className} {...props} />
);
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & { size?: string } & React.ComponentProps<'a'>;

function PaginationLink({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full text-base transition-colors cursor-pointer',
        isActive ? 'bg-blue-100 text-slate-700  font-bold' : 'text-muted-foreground hover:bg-muted',
        size,
        className
      )}
      {...props}
    />
  );
}
PaginationLink.displayName = 'PaginationLink';

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn('gap-1 pl-2.5', className)}
      {...props}
    >
      <span className="sr-only">Previous</span>
      <SvgChevronLeft className="size-4" />
    </PaginationLink>
  );
}
PaginationPrevious.displayName = 'PaginationPrevious';

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn('gap-1 pr-2.5', className)}
      {...props}
    >
      <span className="sr-only">Next</span>
      <SvgChevronRight className="size-4" />
    </PaginationLink>
  );
}
PaginationNext.displayName = 'PaginationNext';

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <SvgEllipsis className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
PaginationEllipsis.displayName = 'PaginationEllipsis';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const renderPaginationItems = () => {
    const items = [];

    // previous
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
        />
      </PaginationItem>
    );

    // 9ページ以内の場合はすべて表示
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink isActive={currentPage === i} onClick={() => onPageChange(i)}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // 10ページ以上の場合
      // 1ページ目は常に表示
      items.push(
        <PaginationItem key={1}>
          <PaginationLink isActive={currentPage === 1} onClick={() => onPageChange(1)}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      // 左の省略記号（現在のページが6以上の場合に表示）
      if (currentPage >= 6) {
        items.push(
          <PaginationItem key="ellipsis-left">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // 中央のページ番号
      let startPage, endPage;
      if (currentPage <= 5) {
        // 現在のページが前半にある場合
        startPage = 2;
        endPage = Math.min(7, totalPages - 1);
      } else if (currentPage >= totalPages - 4) {
        // 現在のページが後半にある場合
        startPage = Math.max(totalPages - 6, 2);
        endPage = totalPages - 1;
      } else {
        // 現在のページが中央にある場合
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }

      // 中央のページ番号を追加
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink isActive={currentPage === i} onClick={() => onPageChange(i)}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // 右の省略記号（最終ページから6ページ以上離れている場合に表示）
      if (currentPage <= totalPages - 5) {
        items.push(
          <PaginationItem key="ellipsis-right">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // 最終ページは常に表示
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // next
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
        />
      </PaginationItem>
    );

    return items;
  };

  return (
    <PaginationContainer className={className}>
      <PaginationContent>{renderPaginationItems()}</PaginationContent>
    </PaginationContainer>
  );
}

export {
  PaginationContainer,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  Pagination,
};
