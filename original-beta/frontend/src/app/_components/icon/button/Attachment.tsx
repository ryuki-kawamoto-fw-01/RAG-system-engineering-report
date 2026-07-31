import * as React from 'react';
import type { SVGProps } from 'react';
function SvgAttachment(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1.2}
        d="m25 17.01-6.738 6.986a6.43 6.43 0 0 1-9.33 0c-2.576-2.67-2.576-7.002 0-9.673l6.738-6.987a4.29 4.29 0 0 1 6.22 0c1.718 1.78 1.718 4.668 0 6.449l-6.738 6.987c-.859.89-2.251.89-3.11 0a2.34 2.34 0 0 1 0-3.225l6.738-6.987"
      />
    </svg>
  );
}
export default SvgAttachment;
