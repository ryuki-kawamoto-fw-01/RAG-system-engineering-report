import * as React from 'react';
import type { SVGProps } from 'react';
function SvgChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="m4 6.5 4 4 4-4"
      />
    </svg>
  );
}
export default SvgChevronDown;
