import * as React from 'react';
import type { SVGProps } from 'react';
function SvgExternal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M13.5 2.5v4m0-4h-4m4 0-6 6m-1-5h-2a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"
      />
    </svg>
  );
}
export default SvgExternal;
