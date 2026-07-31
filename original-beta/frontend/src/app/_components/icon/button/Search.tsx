import * as React from 'react';
import type { SVGProps } from 'react';
function SvgSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M13 13 9.935 9.935m0 0A4.062 4.062 0 1 0 4.19 4.19a4.062 4.062 0 0 0 5.745 5.745"
      />
    </svg>
  );
}
export default SvgSearch;
