import * as React from 'react';
import type { SVGProps } from 'react';
function SvgSend(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
        d="M11.098 16 9.44 10.04c-.233-.835.608-1.56 1.38-1.191l13.01 6.235c.76.365.76 1.467 0 1.832L10.82 23.15c-.772.37-1.613-.356-1.38-1.192zm0 0h4.787"
      />
    </svg>
  );
}
export default SvgSend;
