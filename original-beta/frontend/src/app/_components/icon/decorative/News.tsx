import * as React from 'react';
import type { SVGProps } from 'react';
function SvgNews(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        fill="#AEDDFF"
        d="M20.132 19.153a.75.75 0 0 0 .118-.403v-15a.75.75 0 0 0-1.233-.573C14.105 7.297 9 7.5 9 7.5V15s5.105.203 10.017 4.324a.75.75 0 0 0 1.115-.17"
      />
      <path fill="#3D8DCC" d="M5.25 15H9V7.5H5.25a3.75 3.75 0 0 0 0 7.5" />
      <path
        fill="#B3B3B3"
        d="M8.911 19.166A.75.75 0 0 0 9 18.813V15H5.25l1.241 4.68a.75.75 0 0 0 1.144.443l1.031-.687a.75.75 0 0 0 .245-.27"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="m5.25 15 1.241 4.68a.75.75 0 0 0 1.144.443l1.031-.687A.75.75 0 0 0 9 18.813V15m-3.75 0H9m-3.75 0a3.75 3.75 0 0 1 0-7.5H9M9 15s5.105.203 10.017 4.324a.75.75 0 0 0 1.233-.574v-15a.75.75 0 0 0-1.233-.573C14.105 7.297 9 7.5 9 7.5M9 15V7.5"
      />
    </svg>
  );
}
export default SvgNews;
