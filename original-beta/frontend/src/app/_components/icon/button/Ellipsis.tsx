import * as React from 'react';
import type { SVGProps } from 'react';
function SvgEllipsis(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        fill="currentColor"
        d="M4.5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0M13.5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0"
      />
    </svg>
  );
}
export default SvgEllipsis;
