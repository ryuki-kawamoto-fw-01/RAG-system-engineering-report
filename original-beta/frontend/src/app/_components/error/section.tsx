import React from 'react';

type Props = {
  title: React.ReactNode;
  items: string[];
  className?: string;
};

export default function Section({ title, items, className }: Props) {
  return (
    <div className={className}>
      <div className="flex items-center gap-x-1 text-sm font-bold">{title}</div>
      <ul className="mt-1.5 list-inside list-disc pl-2 text-base marker:text-3xs">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
