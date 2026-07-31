'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../_utils/tw-merge';

type CheckboxSize = 'sm' | 'lg';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    indeterminate?: boolean;
    size?: CheckboxSize;
  }
>(({ className, indeterminate = false, size = 'lg', checked, ...props }, ref) => {
  const checkboxSize = size === 'lg' ? 'size-5' : 'size-4';
  const iconSize = size === 'lg' ? 'size-4' : 'size-3';

  return (
    <div
      className={`relative inline-flex ${checkboxSize} items-center justify-center align-middle`}
    >
      <CheckboxPrimitive.Root
        ref={ref}
        data-indeterminate={indeterminate}
        checked={checked && !indeterminate}
        className={cn(
          `peer ${checkboxSize} shrink-0 bg-white rounded border border-neutral-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground disabled:data-[state=checked]:bg-neutral-200 disabled:data-[state=checked]:border-neutral-200 data-[indeterminate=true]:bg-primary data-[indeterminate=true]:border-primary data-[indeterminate=true]:text-primary-foreground`,
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn('flex items-center justify-center text-current')}
        >
          <Check className={iconSize} strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      {/* indeterminate状態の場合にMinusアイコンを表示 */}
      {indeterminate && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-primary-foreground">
          <Minus className={iconSize} strokeWidth={3} />
        </div>
      )}
    </div>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
