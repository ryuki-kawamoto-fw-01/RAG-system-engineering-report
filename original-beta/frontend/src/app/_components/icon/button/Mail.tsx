import * as React from 'react';
import type { SVGProps } from 'react';
function SvgMail(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 17" {...props}>
      <path
        stroke="#2691DE"
        strokeWidth={1.2}
        d="M2 5v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5M2 5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1M2 5l5.496 3.206a1 1 0 0 0 1.008 0L14 5"
      />
    </svg>
  );
}
export default SvgMail;
