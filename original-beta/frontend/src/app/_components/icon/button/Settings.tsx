import * as React from 'react';
import type { SVGProps } from 'react';
function SvgSettings(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <g clipPath="url(#settings_svg__a)">
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.2}
          d="M9.303 2.024C8.97.66 7.029.66 6.697 2.024a1.34 1.34 0 0 1-2 .829c-1.201-.731-2.575.643-1.844 1.843a1.34 1.34 0 0 1-.829 2.001C.66 7.03.66 8.971 2.024 9.303a1.34 1.34 0 0 1 .829 2c-.731 1.201.643 2.575 1.843 1.844a1.342 1.342 0 0 1 2.001.829c.332 1.365 2.274 1.365 2.606 0a1.34 1.34 0 0 1 2-.829c1.201.731 2.575-.643 1.844-1.843a1.342 1.342 0 0 1 .829-2.001c1.365-.332 1.365-2.274 0-2.606a1.34 1.34 0 0 1-.829-2c.731-1.201-.643-2.575-1.843-1.844a1.34 1.34 0 0 1-2.001-.829M6.35 9.65a2.333 2.333 0 1 1 3.3-3.3 2.333 2.333 0 0 1-3.3 3.3"
          clipRule="evenodd"
        />
      </g>
      <defs>
        <clipPath id="settings_svg__a">
          <path fill="#fff" d="M0 0h16v16H0z" />
        </clipPath>
      </defs>
    </svg>
  );
}
export default SvgSettings;
