import * as React from 'react';
import type { SVGProps } from 'react';
function SvgCode(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
      <path
        fill="#fff"
        d="M10 9h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2"
      />
      <path
        fill="#7EB771"
        fillRule="evenodd"
        d="M9 6h14a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4m13 3H10a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2"
        clipRule="evenodd"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="m19 14 2 2-2 2m-2-5-2 6m-2-5-2 2 2 2m-4 8h14a4 4 0 0 0 4-4V10a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4m1-3h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2"
      />
    </svg>
  );
}
export default SvgCode;
