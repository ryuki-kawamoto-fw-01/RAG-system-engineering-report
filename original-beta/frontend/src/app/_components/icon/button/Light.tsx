import * as React from 'react';
import type { SVGProps } from 'react';
function SvgLight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M8 2v1m0 10v1m6-6h-1M3 8H2m1.757 4.243.707-.707m7.072-7.072.707-.707m0 8.486-.707-.707m-7.07-7.071-.708-.707M5.333 8a2.667 2.667 0 1 0 5.334 0 2.667 2.667 0 0 0-5.334 0"
      />
    </svg>
  );
}
export default SvgLight;
