import * as React from 'react';
import type { SVGProps } from 'react';
function SvgCopy(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeWidth={1.2}
        d="M10.2 5.8H7A1.2 1.2 0 0 0 5.8 7v3.2m4.4-4.4h1.6A1.2 1.2 0 0 1 13 7v4.8a1.2 1.2 0 0 1-1.2 1.2H7a1.2 1.2 0 0 1-1.2-1.2v-1.6m4.4-4.4V4.2A1.2 1.2 0 0 0 9 3H4.2A1.2 1.2 0 0 0 3 4.2V9a1.2 1.2 0 0 0 1.2 1.2h1.6"
      />
    </svg>
  );
}
export default SvgCopy;
