'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '../../_utils/tw-merge';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-black">
      <SliderPrimitive.Range className="absolute h-full bg-sky-300 data-[disabled]:pointer-events-none data-[disabled]:bg-neutral-200 dark:bg-white" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block size-[18px] rounded-full border border-neutral-100 bg-white shadow-[0px_1px_4px_0px_rgba(114,150,201,0.15)] focus:ring-4 focus:ring-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
