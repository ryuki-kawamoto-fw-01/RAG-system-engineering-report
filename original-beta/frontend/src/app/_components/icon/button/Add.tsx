import * as React from 'react';
import type { SVGProps } from 'react';
function SvgAdd(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeWidth={1.2} d="M8 3.5v9M3.5 8h9" />
    </svg>
  );
}
export default SvgAdd;
