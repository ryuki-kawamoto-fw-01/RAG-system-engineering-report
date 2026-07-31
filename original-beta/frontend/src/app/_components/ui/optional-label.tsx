import React from 'react';
import { FormLabel } from './form';

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function OptionalLabel({ children, className }: Props) {
  return (
    <FormLabel className={className}>
      {children}
      <span className="text-3xs text-neutral-500">※任意</span>
    </FormLabel>
  );
}
