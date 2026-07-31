import * as React from 'react';
import type { SVGProps } from 'react';
function SvgMail(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
      <path
        fill="#7EB3DD"
        d="M26 8H5.5A1.5 1.5 0 0 0 4 9.5l11.445 7.63a1 1 0 0 0 1.11 0l11.39-7.594A2 2 0 0 0 26 8"
      />
      <path
        fill="#fff"
        d="M28 22V10q0-.24-.054-.464L16.555 17.13a1 1 0 0 1-1.11 0L4 9.5V22a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2"
      />
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="m28 9.5-.054.036M4 9.5V22a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V10q0-.24-.054-.464M4 9.5l11.445 7.63a1 1 0 0 0 1.11 0l11.39-7.594M4 9.5A1.5 1.5 0 0 1 5.5 8H26a2 2 0 0 1 1.946 1.536"
      />
    </svg>
  );
}
export default SvgMail;
