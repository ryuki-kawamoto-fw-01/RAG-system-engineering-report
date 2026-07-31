import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../_utils/tw-merge';

const tagVariants = cva('inline-flex items-center justify-center align-middle', {
  variants: {
    type: {
      // 必須/任意
      require: 'h-[17px] rounded-[4px] px-[6px] text-3xs font-bold',
      // AIAgentタスク進行状況
      status: 'h-[18px] rounded-full px-2 text-2xs font-normal',
    },
    color: {
      red: 'bg-red-600 text-white', // 必須・失敗
      gray: 'bg-neutral-400 text-white', // 任意
      orange: 'bg-orange-600 text-white', // 要確認
      sky: 'bg-sky-200 text-black', // 進行中
      yellow: 'bg-yellow-300 text-black', // 停止中
      lightGray: 'bg-slate-300 text-black', // 完了
    },
  },
  defaultVariants: {
    // デフォルト：必須
    type: 'require',
    color: 'red',
  },
});

export interface TagProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>, VariantProps<typeof tagVariants> {}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ className, type, color, children, ...props }) => {
    return (
      <div className={cn(tagVariants({ type, color, className }))} {...props}>
        {children}
      </div>
    );
  }
);

Tag.displayName = 'Tag';

export { Tag, tagVariants };
