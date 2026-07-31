import * as React from 'react';
import type { SVGProps } from 'react';
function SvgScale(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
      <path
        fill="#7EB3DD"
        fillRule="evenodd"
        d="M12 16.667H4c0 1.149.421 2.251 1.172 3.064S6.939 21 8 21s2.078-.456 2.828-1.27c.75-.812 1.172-1.914 1.172-3.063M28 16.667h-8c0 1.149.421 2.251 1.172 3.064S22.939 21 24 21s2.078-.456 2.828-1.27c.75-.812 1.172-1.914 1.172-3.063"
        clipRule="evenodd"
      />
      <path fill="#7EB3DD" d="M16 25h-6v3h12v-3z" />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="m8 8 8-1.333L24 8M8 8l4 8.667M8 8l-4 8.667M24 8l4 8.667M24 8l-4 8.667M16 4v21m-4-8.333c0 1.149-.421 2.251-1.172 3.064S9.061 21 8 21s-2.078-.456-2.828-1.27C4.422 18.919 4 17.817 4 16.668m8 0H4m24 0c0 1.149-.421 2.251-1.172 3.064S25.061 21 24 21s-2.078-.456-2.828-1.27c-.75-.812-1.172-1.914-1.172-3.063m8 0h-8M16 25h-6v3h12v-3z"
      />
    </svg>
  );
}
export default SvgScale;
