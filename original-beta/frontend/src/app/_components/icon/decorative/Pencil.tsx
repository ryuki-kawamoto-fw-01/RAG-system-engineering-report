import * as React from 'react';
import type { SVGProps } from 'react';
function SvgPencil(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
      <path
        fill="currentColor"
        d="m7.18 28.947 1.488-1.372L6.797 26.5l-.444 1.97a.5.5 0 0 0 .827.477"
      />
      <path
        fill="#7EB771"
        d="m22.11 5.465-2.886-1.667a1 1 0 0 0-1.366.366L7.969 21.292l4.619 2.667 9.889-17.128a1 1 0 0 0-.366-1.366"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M14.668 28h12m-14.08-4.041 9.889-17.128a1 1 0 0 0-.366-1.366l-2.887-1.667a1 1 0 0 0-1.366.366L7.969 21.292m4.619 2.667-4.619-2.667m4.619 2.667L7.18 28.947m.79-7.655L6.352 28.47m.827.477a.5.5 0 0 1-.827-.477m.827.477 1.488-1.372L6.797 26.5l-.444 1.97"
      />
    </svg>
  );
}
export default SvgPencil;
