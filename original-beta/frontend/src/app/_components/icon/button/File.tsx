import * as React from 'react';
import type { SVGProps } from 'react';
function SvgFile(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path fill="#fff" d="M3.5 13V3a1 1 0 0 1 1-1h4l4 4v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1" />
      <path
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M8.5 2h-4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V6m-4-4v3a1 1 0 0 0 1 1h3m-4-4 4 4"
      />
    </svg>
  );
}
export default SvgFile;
