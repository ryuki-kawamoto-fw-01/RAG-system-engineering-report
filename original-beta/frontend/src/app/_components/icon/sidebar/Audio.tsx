import * as React from 'react';
import type { SVGProps } from 'react';
function SvgAudio(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        fill="#3D8DCC"
        d="M8.867 6.6c0-1.636 1.382-3 3.133-3s3.134 1.364 3.134 3v4.5c0 1.636-1.382 3-3.134 3-1.75 0-3.133-1.364-3.133-3z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 2.4c-2.372 0-4.333 1.86-4.333 4.2v4.5c0 2.34 1.96 4.2 4.333 4.2s4.334-1.86 4.334-4.2V6.6c0-2.34-1.961-4.2-4.334-4.2M8.867 6.6c0-1.636 1.382-3 3.133-3s3.134 1.364 3.134 3v4.5c0 1.636-1.382 3-3.134 3-1.75 0-3.133-1.364-3.133-3z"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        d="M5.6 11.1a.6.6 0 0 0-1.2 0c0 3.883 3.1 7.032 7 7.327V20.4H8.267a.6.6 0 0 0 0 1.2h7.467a.6.6 0 1 0 0-1.2H12.6v-1.973c3.9-.295 7-3.444 7-7.327a.6.6 0 0 0-1.2 0c0 3.376-2.844 6.15-6.4 6.15-3.555 0-6.4-2.774-6.4-6.15"
      />
    </svg>
  );
}
export default SvgAudio;
