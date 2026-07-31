import * as React from 'react';
import type { SVGProps } from 'react';
function SvgDocument(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M18 4h-8a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V12m-8-8 8 8m-8-8v7a1 1 0 0 0 1 1h7m-13.5 1H15m-2.5 4.5h9m-9 4.5h9"
      />
    </svg>
  );
}
export default SvgDocument;
