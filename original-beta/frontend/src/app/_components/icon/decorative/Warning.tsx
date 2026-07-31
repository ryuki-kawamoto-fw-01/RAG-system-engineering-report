import * as React from 'react';
import type { SVGProps } from 'react';
function SvgWarning(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        fill="#DC2626"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="m13.352 3.77 8.199 14.238c.575 1.004-.168 2.242-1.351 2.242H3.801c-1.183 0-1.925-1.238-1.35-2.242L10.65 3.771c.59-1.028 2.11-1.028 2.701 0"
      />
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M12 8a1 1 0 0 1 1 1v4.5a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1"
        clipRule="evenodd"
      />
      <path fill="#fff" d="M12 18a1.125 1.125 0 1 0 0-2.25A1.125 1.125 0 0 0 12 18" />
    </svg>
  );
}
export default SvgWarning;
