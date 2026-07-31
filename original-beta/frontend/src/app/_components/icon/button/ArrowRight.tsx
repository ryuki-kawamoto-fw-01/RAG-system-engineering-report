import * as React from 'react';
import type { SVGProps } from 'react';
function SvgArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M2.5 8H13m0 0-3-3m3 3-3 3"
      />
    </svg>
  );
}
export default SvgArrowRight;
