import * as React from 'react';
import type { SVGProps } from 'react';
function SvgDelete(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M2 4h12M3 4l.714 8.929c0 .416.15.816.419 1.11.268.295.631.461 1.01.461h5.714c.379 0 .742-.166 1.01-.46s.419-.695.419-1.111L13 4M6 4V2.333a.95.95 0 0 1 .195-.589.6.6 0 0 1 .472-.244h2.666c.177 0 .347.088.472.244a.95.95 0 0 1 .195.59V4M6.25 7.25l.25 4m3.25-4-.25 4"
      />
    </svg>
  );
}
export default SvgDelete;
