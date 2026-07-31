import * as React from 'react';
import type { SVGProps } from 'react';
function SvgMute(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M8 12.063a4.69 4.69 0 0 0 4.688-4.688M8 12.063a4.69 4.69 0 0 1-4.687-4.688M8 12.063v2.187m-2.5 0h5M8 9.875a2.5 2.5 0 0 1-2.5-2.5V4.25a2.5 2.5 0 0 1 5 0v3.125a2.5 2.5 0 0 1-2.5 2.5"
      />
    </svg>
  );
}
export default SvgMute;
