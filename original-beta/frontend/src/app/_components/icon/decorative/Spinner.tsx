import * as React from 'react';
import type { SVGProps } from 'react';
function SvgSpinner(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
      <g fill="#fff">
        <path
          fillOpacity={0.3}
          d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"
        />
        <path d="M12 1.5c0-.828-.674-1.51-1.496-1.406a12 12 0 0 0-10.41 10.41C-.01 11.326.672 12 1.5 12s1.487-.676 1.625-1.493a9 9 0 0 1 7.382-7.382C11.324 2.987 12 2.328 12 1.5" />
      </g>
    </svg>
  );
}
export default SvgSpinner;
