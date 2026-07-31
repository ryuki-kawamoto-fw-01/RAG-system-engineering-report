import clsx from 'clsx';
import React from 'react';
import { Card } from '@/app/_components/ui/card';
import { mapIndexNameByLabel } from '../_util/category-display';

type SidebarMenuItem = {
  id: string;
  label: React.ReactNode;
};

type SidebarMenuProps = {
  items: SidebarMenuItem[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  renderItem?: (item: SidebarMenuItem, isSelected: boolean) => React.ReactNode;
};

export function SidebarMenu({ items, onSelect, selectedId, renderItem }: SidebarMenuProps) {
  // 並び替えを行わず、渡された順（categories の定義順）で表示
  return (
    <div className="flex h-full flex-col overflow-auto bg-white px-2 py-3">
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        const displayedLabel =
          typeof item.label === 'string' ? mapIndexNameByLabel(item.label) : item.label;
        return (
          <Card
            key={item.id}
            role="button"
            tabIndex={0}
            className={clsx(
              'flex h-8 w-full cursor-pointer items-center justify-start gap-1 border-none px-1.5 py-0.5 text-neutral-900 shadow-none transition-colors hover:bg-neutral-100',
              {
                'bg-slate-100': isSelected,
              }
            )}
            onClick={() => onSelect(item.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(item.id);
            }}
          >
            {renderItem ? (
              renderItem(item, isSelected)
            ) : (
              <span className="truncate text-sm font-normal text-neutral-900 dark:text-neutral-50">
                {displayedLabel}
              </span>
            )}
          </Card>
        );
      })}
    </div>
  );
}
