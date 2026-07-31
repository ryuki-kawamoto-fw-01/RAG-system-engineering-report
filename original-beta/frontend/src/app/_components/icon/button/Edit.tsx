import * as React from 'react';
import type { SVGProps } from 'react';
function SvgEdit(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M6.965 3.5h-2.48C3.388 3.5 2.5 4.466 2.5 5.562v5.953c0 1.096.889 1.985 1.985 1.985h5.953c1.096 0 2.062-.889 2.062-1.985v-2.48m-6.527.992L7.73 9.83a1 1 0 0 0 .591-.284l4.887-4.888a.99.99 0 0 0 0-1.403l-.464-.464a.99.99 0 0 0-1.403 0L6.452 7.68a1 1 0 0 0-.284.592z"
      />
    </svg>
  );
}
export default SvgEdit;
