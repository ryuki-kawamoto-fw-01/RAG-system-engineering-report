'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../_utils/tw-merge';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('flex items-center', {
  variants: {
    variant: {
      default: 'h-8 rounded-lg border border-neutral-200 bg-white p-1',
      underline: 'bg-inherit',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
interface TabsListProps
  extends
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}
const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ variant, className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
);
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  'ring-offset-background inline-flex flex-1 items-center justify-center whitespace-nowrap font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'h-6 rounded-[4px] bg-white px-3 py-1 text-xs data-[state=active]:bg-neutral-900/[4%]',
        underline:
          'h-9 border-b border-slate-300 px-5 py-0 text-sm font-bold text-neutral-500 hover:bg-neutral-900/[4%] data-[state=active]:border-b-[3px] data-[state=active]:border-sky-600 data-[state=active]:text-neutral-900 data-[state=active]:hover:bg-inherit',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
interface TabsTriggerProps
  extends
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ variant, className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
