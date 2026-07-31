import * as React from 'react';
import type { SVGProps } from 'react';
function SvgTextFile(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36" {...props}>
      <path fill="#fff" d="M20.679 9v4c0 .265.101.52.282.707.18.188.426.293.682.293H25.5" />
      <path
        fill="#fff"
        d="M23.571 27H13.93c-.512 0-1.002-.21-1.364-.586A2.04 2.04 0 0 1 12 25V11c0-.53.203-1.04.565-1.414A1.9 1.9 0 0 1 13.929 9h6.75l4.821 5v11c0 .53-.203 1.04-.565 1.414a1.9 1.9 0 0 1-1.364.586"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M20.679 9v4c0 .265.101.52.282.707.18.188.426.293.682.293H25.5m-4.821-5h-6.75c-.512 0-1.002.21-1.364.586A2.04 2.04 0 0 0 12 11v14c0 .53.203 1.04.565 1.414.362.375.852.586 1.364.586h9.642c.512 0 1.002-.21 1.364-.586.362-.375.565-.884.565-1.414V14m-4.821-5 4.821 5"
      />
    </svg>
  );
}
export default SvgTextFile;
