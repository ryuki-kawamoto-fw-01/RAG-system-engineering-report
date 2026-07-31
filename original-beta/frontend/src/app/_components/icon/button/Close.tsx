import * as React from 'react';
import type { SVGProps } from 'react';
function SvgClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="m3 3 10 10m0-10L3 13"
      />
    </svg>
  );
}
export default SvgClose;
