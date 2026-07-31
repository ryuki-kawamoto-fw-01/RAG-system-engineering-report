import * as React from 'react';
import type { SVGProps } from 'react';
function SvgFolder(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        fill="#FCD34D"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M2 11.5v-7a1 1 0 0 1 1-1h3.441c.343 0 .656.194.809.5s.466.5.809.5H13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z"
      />
    </svg>
  );
}
export default SvgFolder;
