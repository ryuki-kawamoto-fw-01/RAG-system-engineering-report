import * as React from 'react';
import type { SVGProps } from 'react';
function SvgSave(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M5 13.5v-4a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v4M9.5 5H6m7.5.207V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5h7.793a.5.5 0 0 1 .353.146l2.208 2.208a.5.5 0 0 1 .146.353"
      />
    </svg>
  );
}
export default SvgSave;
