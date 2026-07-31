import * as React from 'react';
import type { SVGProps } from 'react';
function SvgAudio(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2 6v4m4-8.5v13m4-11v9M14 6v4"
      />
    </svg>
  );
}
export default SvgAudio;
