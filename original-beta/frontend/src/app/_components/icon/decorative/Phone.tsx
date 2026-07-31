import * as React from 'react';
import type { SVGProps } from 'react';
function SvgPhone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        fill="#3BADFF"
        d="M10.289 9.508a.56.56 0 0 1 .536-.05l3.332 1.494a.57.57 0 0 1 .34.586 3.415 3.415 0 0 1-3.388 2.962A9.61 9.61 0 0 1 1.5 4.891a3.415 3.415 0 0 1 2.962-3.387.565.565 0 0 1 .586.34l1.493 3.334a.56.56 0 0 1-.046.532L4.788 6.907a.56.56 0 0 0-.038.551c.291.596.69 1.65 1.408 2.384.724.74 1.77 1.16 2.372 1.45a.56.56 0 0 0 .553-.042z"
      />
    </svg>
  );
}
export default SvgPhone;
