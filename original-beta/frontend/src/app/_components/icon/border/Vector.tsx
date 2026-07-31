import * as React from 'react';
import type { SVGProps } from 'react';
function SvgVector(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 10" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M1.5 5h13m0 0-4-4m4 4-4 4"
      />
    </svg>
  );
}
export default SvgVector;
