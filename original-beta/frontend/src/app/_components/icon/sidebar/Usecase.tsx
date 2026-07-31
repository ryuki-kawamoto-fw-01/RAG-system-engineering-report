import * as React from 'react';
import type { SVGProps } from 'react';
function SvgUsecase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8.4 5A1.6 1.6 0 0 1 10 3.4h9A1.6 1.6 0 0 1 20.6 5v3.408a.6.6 0 0 1 .5.592v6.667a1.6 1.6 0 0 1-.32.96l-2.5 3.333a1.6 1.6 0 0 1-.48.426l-.003.002A1.6 1.6 0 0 1 17 20.6H4.5A1.6 1.6 0 0 1 2.9 19v-6a.6.6 0 0 1 .5-.592V10A1.6 1.6 0 0 1 5 8.4h.9v-.9a1.6 1.6 0 0 1 1.6-1.6h.9zm1.2.9h6.9a1.6 1.6 0 0 1 1.6 1.6v3.7l1.3-1.733V5a.4.4 0 0 0-.4-.4h-9a.4.4 0 0 0-.4.4zm10.3 4.9-1.8 2.4v5l1.72-2.293a.4.4 0 0 0 .08-.24zM7.1 8.4H14a1.6 1.6 0 0 1 1.6 1.6v2.4h1.3V7.5a.4.4 0 0 0-.4-.4h-9a.4.4 0 0 0-.4.4zm9.8 5.2H4.1V19c0 .22.18.4.4.4h12.4zM4.6 12.4h9.8V10a.4.4 0 0 0-.4-.4H5a.4.4 0 0 0-.4.4z"
        clipRule="evenodd"
      />
      <path
        fill="#FCD34D"
        d="M4.1 19v-5.4h12.8v5.8H4.5a.4.4 0 0 1-.4-.4M18.1 13.2l1.8-2.4v4.867a.4.4 0 0 1-.08.24L18.1 18.2z"
      />
      <path fill="#fff" d="M14.4 10v2.4H4.6V10c0-.22.18-.4.4-.4h9c.221 0 .4.18.4.4" />
      <path
        fill="#fff"
        d="M14 8.4H7.1v-.9c0-.22.18-.4.4-.4h9c.221 0 .4.18.4.4v4.9h-1.3V10A1.6 1.6 0 0 0 14 8.4"
      />
      <path
        fill="#fff"
        d="M16.5 5.9H9.6V5c0-.22.18-.4.4-.4h9c.221 0 .4.18.4.4v4.467L18.1 11.2V7.5a1.6 1.6 0 0 0-1.6-1.6"
      />
    </svg>
  );
}
export default SvgUsecase;
