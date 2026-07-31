import * as React from 'react';
import type { SVGProps } from 'react';
function SvgPrompt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        fill="#FCD34D"
        d="M12.862 3.802a.376.376 0 0 1 .523-.15l1.714 1.015c.186.11.261.368.145.574L8.33 17.516 5.936 16.1z"
      />
      <path fill="#fff" d="m5.533 17.255 2.029 1.2-1.828 1.73-.74-.477z" />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M13.996 2.62a1.576 1.576 0 0 0-2.18.593L4.602 16.022a.6.6 0 0 0-.063.166L3.427 21.25c-.222 1.01.992 1.828 1.816 1.048l3.722-3.518a.6.6 0 0 0 .11-.142L16.29 5.83c.43-.763.18-1.746-.58-2.196zm-1.134 1.182a.376.376 0 0 1 .523-.15l1.714 1.015c.186.11.261.368.145.574L8.33 17.516 5.936 16.1zM5.533 17.255l2.029 1.2-1.828 1.73-.74-.477z"
        clipRule="evenodd"
      />
      <path fill="currentColor" d="M10.096 20.819a.6.6 0 1 0 0 1.2H19a.6.6 0 0 0 0-1.2z" />
    </svg>
  );
}
export default SvgPrompt;
