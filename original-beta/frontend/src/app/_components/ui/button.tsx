import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../_utils/tw-merge';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-base font-bold text-neutral-900 shadow-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-neutral-200 disabled:shadow-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-sky-700',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-blue-800',
        tertiary:
          'border border-neutral-100 bg-tertiary font-medium text-tertiary-foreground hover:bg-neutral-50 disabled:bg-white disabled:text-neutral-400',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-red-700',
        dropdown:
          'border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg border text-neutral-900',
        // TODO: あとで削除
        outline: 'border-input bg-background hover:bg-accent hover:text-accent-foreground border',
        ghost: 'hover:bg-accent hover:text-accent-foreground shadow-none',
        link: 'font-normal underline underline-offset-2 shadow-none',
        icon: 'rounded-lg text-neutral-800 shadow-none hover:bg-neutral-900/[4%] disabled:bg-inherit disabled:text-neutral-400',
        text: 'rounded-lg font-normal shadow-none hover:bg-neutral-900/[4%] disabled:bg-inherit disabled:text-neutral-400',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[svg]:gap-x-[6px] has-[svg]:pl-4 has-[svg]:pr-5',
        sm: 'h-[30px] px-3 text-sm font-medium has-[svg]:gap-x-[4px] has-[svg]:pl-3 has-[svg]:pr-[14px]',
        icon: 'size-8',
        'icon-sm': 'size-6 rounded-[4px]',
        text: 'h-[30px] px-3 text-sm has-[svg]:gap-x-[4px] has-[svg]:px-2 has-[svg]:py-1',
        'text-sm': 'h-6 px-2 text-xs has-[svg]:gap-x-[2px] has-[svg]:px-[6px] has-[svg]:py-[2px]',
        link: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
