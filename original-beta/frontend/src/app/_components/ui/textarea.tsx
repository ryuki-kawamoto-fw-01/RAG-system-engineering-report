'use client';
import { cva, VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { useFormContext } from 'react-hook-form';
import { cn } from '../../_utils/tw-merge';

const textareaVariants = cva(
  'bg-background ring-offset-background flex min-h-[98px] w-full resize-y rounded-lg border border-neutral-100 px-4 py-2 shadow-default placeholder:text-neutral-400 focus-visible:border-ring focus-visible:outline-none focus-visible:ring focus-visible:ring-sky-100 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50 disabled:shadow-none dark:text-white',
  {
    variants: {
      variant: {
        default: '',
        destructive:
          'border-destructive bg-red-50 focus-visible:border-destructive focus-visible:ring-0',
      },
      size: {
        sm: 'py-2.5 text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface TextareaProps
  extends
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  showCounter?: boolean;
  maxLength?: number;
  outerClass?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ size, name, showCounter = false, maxLength, className, outerClass, ...props }, ref) => {
    let variant = props.variant;
    const context = useFormContext();
    let value;

    if (context && name) {
      value = context.watch(name, '');
      const error = context.formState.errors[name];
      variant = error ? 'destructive' : 'default';
    }
    return (
      <div className={cn('relative h-full', outerClass)}>
        <textarea
          className={cn(textareaVariants({ variant, size, className }))}
          ref={ref}
          name={name}
          {...props}
        />
        {value !== undefined && showCounter && (
          <div className="absolute bottom-1 right-4 text-xs text-neutral-400">
            {maxLength ? (
              <>{`${value.length.toLocaleString()}/${maxLength.toLocaleString()}`}</>
            ) : (
              <>{`${value.length.toLocaleString()}字`}</>
            )}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
