import React from 'react';
import { FormLabel } from './form';

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function RequiredLabel({ children, className }: Props) {
  return (
    <FormLabel className={className}>
      {children}
      <span className="text-3xs text-red-600">※必須</span>
    </FormLabel>
  );
}
