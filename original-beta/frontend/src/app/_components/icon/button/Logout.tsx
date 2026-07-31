import * as React from 'react';
import type { SVGProps } from 'react';
function SvgLogout(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="#DC2626"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M8.5 11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-2 3h7m0 0-2-2m2 2-2 2"
      />
    </svg>
  );
}
export default SvgLogout;
