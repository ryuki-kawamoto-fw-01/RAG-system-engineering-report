import * as React from 'react';
import type { SVGProps } from 'react';
function SvgSource(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 13.5a5.5 5.5 0 1 0 0-11m0 11a5.5 5.5 0 1 1 0-11m0 11s2.292-1.833 2.292-5.5S8 2.5 8 2.5m0 11S5.708 11.667 5.708 8 8 2.5 8 2.5M2.813 6.167h10.374M2.813 9.833h10.374"
      />
    </svg>
  );
}
export default SvgSource;
