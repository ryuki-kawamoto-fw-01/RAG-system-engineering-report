import * as React from 'react';
import type { SVGProps } from 'react';
function SvgDark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M7.977 2.005h.262a5.014 5.014 0 0 0-.812 6.347 5 5 0 0 0 2.685 2.078 4.97 4.97 0 0 0 3.388-.127 6 6 0 0 1-1.964 2.52 5.966 5.966 0 0 1-8.53-1.492 6.014 6.014 0 0 1 1.899-8.477A5.96 5.96 0 0 1 7.977 2z"
      />
    </svg>
  );
}
export default SvgDark;
