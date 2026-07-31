import * as React from 'react';
import type { SVGProps } from 'react';
function SvgUpload(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M14 10v2.667A1.334 1.334 0 0 1 12.667 14H3.333A1.334 1.334 0 0 1 2 12.667V10m9-5L8 2m0 0L5 5m3-3v8"
      />
    </svg>
  );
}
export default SvgUpload;
