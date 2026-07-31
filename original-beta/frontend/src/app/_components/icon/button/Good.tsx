import * as React from 'react';
import type { SVGProps } from 'react';
function SvgGood(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M5.088 7.374v4.998m0-4.998h-1.94a.66.66 0 0 0-.458.183.61.61 0 0 0-.19.441v4.374c0 .166.068.325.19.442a.66.66 0 0 0 .457.183h1.294a.66.66 0 0 0 .458-.183.61.61 0 0 0 .19-.442m0-4.998c.686 0 1.344-.264 1.83-.732a2.46 2.46 0 0 0 .757-1.768V4.25c0-.332.137-.65.38-.884.242-.234.571-.366.915-.366.343 0 .672.132.915.366.242.234.379.552.379.884v3.124h1.94c.344 0 .673.131.916.366s.379.552.379.883l-.647 3.124c-.093.384-.27.713-.503.938-.233.226-.511.335-.791.312h-4.53a1.98 1.98 0 0 1-1.372-.549 1.84 1.84 0 0 1-.569-1.325m0-3.75v3.75m0 1.25v-1.25"
      />
    </svg>
  );
}
export default SvgGood;
