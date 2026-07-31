'use client';

import { cva, VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { useRef } from 'react';
import { cn } from '@/app/_utils/tw-merge';
import SvgExternal from '../icon/button/External';

const linkVariants = cva(
  'inline-flex items-center gap-x-1 rounded text-base font-normal text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

interface Props
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof linkVariants> {
  href: string;
  showIcon?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function TextLink({
  href,
  size,
  showIcon = true,
  children,
  className = '',
  ...props
}: Props) {
  const isMailto = href.startsWith('mailto:');
  const isNewTab = props.target === '_blank';
  const isExternal = href.startsWith('http');
  const linkRef = useRef<HTMLAnchorElement>(null);

  // mailto:の場合、クリック時にhrefを一度空にして複数回クリック時に対応する
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMailto && linkRef.current) {
      // 一度hrefを空にする
      linkRef.current.href = '';
      // 遅延させてリロード状態に戻す
      setTimeout(() => {
        if (linkRef.current) {
          linkRef.current.href = href;
        }
      }, 100);
    }
    if (props.onClick) props.onClick(e);
  };

  if (isMailto || isExternal) {
    return (
      <a
        ref={linkRef}
        href={href}
        className={cn(linkVariants({ size, className }))}
        rel={isNewTab ? 'noopener noreferrer' : undefined}
        onClick={handleClick}
        {...props}
      >
        {children}
        {showIcon && (isNewTab || isExternal) && (
          <SvgExternal className="size-4 shrink-0 text-primary" />
        )}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={cn(linkVariants({ size, className }))}
      rel={isNewTab ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
      {showIcon && (isNewTab || isExternal) && (
        <SvgExternal className="size-4 shrink-0 text-primary" />
      )}
    </Link>
  );
}
