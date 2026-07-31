import * as React from 'react';
import type { SVGProps } from 'react';
function SvgUserDefault(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
      <rect width={32} height={32} fill="#DFE8ED" rx={16} />
      <g fill="#A1B6C5">
        <path d="M19.755 11.745A3.75 3.75 0 0 1 16 15.491a3.75 3.75 0 0 1-3.755-3.746A3.75 3.75 0 0 1 16 8a3.75 3.75 0 0 1 3.755 3.745M24 21.825C24 23.984 20.418 25 16 25s-8-1.016-8-3.175 3.582-4.56 8-4.56 8 2.402 8 4.56" />
      </g>
    </svg>
  );
}
export default SvgUserDefault;
