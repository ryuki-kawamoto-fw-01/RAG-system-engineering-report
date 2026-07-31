import * as React from 'react';
import type { SVGProps } from 'react';
function SvgBulb(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
      <path
        fill="#fff"
        d="M11.796 5.19a7.8 7.8 0 0 0-2.967 3.194A8.4 8.4 0 0 0 8 12.125a8.4 8.4 0 0 0 .913 3.72c1.102 2.114 2.808 3.676 3.2 6.008h7.772c.391-2.332 2.097-3.895 3.2-6.008a8.4 8.4 0 0 0 .913-3.72 8.4 8.4 0 0 0-.828-3.74C21.843 5.684 18.936 4 16.001 4a8.17 8.17 0 0 0-4.205 1.19"
      />
      <path
        fill="#FCD34D"
        d="M19.886 21.853h-7.772v3.077h7.772zM12.114 25.114a3.886 3.886 0 0 0 7.772 0v-.184h-7.772z"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12.114 21.853c-.392-2.332-2.098-3.895-3.2-6.008A8.4 8.4 0 0 1 8 12.125a8.4 8.4 0 0 1 .828-3.74 7.8 7.8 0 0 1 2.967-3.195A8.17 8.17 0 0 1 16 4c2.936 0 5.843 1.685 7.171 4.384A8.4 8.4 0 0 1 24 12.125a8.4 8.4 0 0 1-.913 3.72c-1.103 2.113-2.809 3.676-3.2 6.008m-7.772 0h7.772m-7.772 0v3.077m7.772-3.077v3.077m-7.772 0v.184a3.886 3.886 0 0 0 7.772 0v-.184m-7.772 0h7.772"
      />
    </svg>
  );
}
export default SvgBulb;
