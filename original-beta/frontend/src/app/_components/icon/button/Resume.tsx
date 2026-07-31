import * as React from 'react';
import type { SVGProps } from 'react';
function SvgResume(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeWidth={1.2}
        d="M4.5 11.742V4.258c0-.786.846-1.269 1.506-.859l6.02 3.742a1.016 1.016 0 0 1 0 1.718l-6.02 3.742c-.66.41-1.506-.073-1.506-.86Z"
      />
    </svg>
  );
}
export default SvgResume;
