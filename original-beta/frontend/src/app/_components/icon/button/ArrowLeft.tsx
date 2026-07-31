import * as React from 'react';
import type { SVGProps } from 'react';
function SvgArrowLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M13.5 8H3m0 0 3-3M3 8l3 3"
      />
    </svg>
  );
}
export default SvgArrowLeft;
