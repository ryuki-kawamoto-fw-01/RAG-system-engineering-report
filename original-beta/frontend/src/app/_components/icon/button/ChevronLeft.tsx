import * as React from 'react';
import type { SVGProps } from 'react';
function SvgChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="m9.5 12-4-4 4-4"
      />
    </svg>
  );
}
export default SvgChevronLeft;
