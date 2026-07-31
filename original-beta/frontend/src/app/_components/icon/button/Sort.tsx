import * as React from 'react';
import type { SVGProps } from 'react';
function SvgSort(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M11 5 8 2 5 5m6 6-3 3-3-3"
      />
    </svg>
  );
}
export default SvgSort;
