import * as React from 'react';
import type { SVGProps } from 'react';
function SvgInfo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M7.5 7.7H8v3.5m0 0h-.5m.5 0h.5M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0"
      />
      <circle cx={7.899} cy={5.15} r={0.85} fill="currentColor" />
    </svg>
  );
}
export default SvgInfo;
