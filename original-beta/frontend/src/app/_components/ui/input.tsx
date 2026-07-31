'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '../../_utils/tw-merge';

export const inputVariants = cva(
  'bg-background ring-offset-background flex w-full rounded-lg border border-neutral-100 px-4 py-2 font-normal shadow-default file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-neutral-400 focus-visible:border-ring focus-visible:outline-none focus-visible:ring focus-visible:ring-sky-100 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50 disabled:shadow-none',
  {
    variants: {
      variant: {
        default: '',
        destructive:
          'border-destructive bg-red-50 focus-visible:border-destructive focus-visible:ring-0',
      },
      inputSize: {
        sm: 'h-9 text-sm',
        md: 'h-9 text-base',
        lg: 'h-10 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, name, ...props }, ref) => {
    let variant = props.variant;
    const context = useFormContext();
    if (context && name) {
      const error = context.formState.errors[name];
      variant = error ? 'destructive' : 'default';
    }

    return (
      <input
        type={type}
        name={name}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
