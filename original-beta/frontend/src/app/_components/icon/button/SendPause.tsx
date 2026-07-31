import * as React from 'react';
import type { SVGProps } from 'react';
function SvgSendPause(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
      <rect width={32} height={32} fill="#14344D" rx={16} />
      <path
        fill="#fff"
        d="M10.5 11.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z"
      />
    </svg>
  );
}
export default SvgSendPause;
