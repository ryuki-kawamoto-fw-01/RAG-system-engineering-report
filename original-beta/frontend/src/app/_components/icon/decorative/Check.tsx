import * as React from 'react';
import type { SVGProps } from 'react';
function SvgCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="m1.5 9.5 4 4 9-9"
      />
    </svg>
  );
}
export default SvgCheck;
