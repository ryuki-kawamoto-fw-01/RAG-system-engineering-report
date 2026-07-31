import * as React from 'react';
import type { SVGProps } from 'react';
function SvgGraph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
      <path fill="#fff" d="M7 17a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v8H7z" />
      <path
        fill="#FCD34D"
        d="M14 13a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v12h-5zM21 7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v18h-5z"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1.5}
        d="M5 25h22m-15 0v-8a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v8zm7 0V13a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v12zm7 0V7a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v18z"
      />
    </svg>
  );
}
export default SvgGraph;
