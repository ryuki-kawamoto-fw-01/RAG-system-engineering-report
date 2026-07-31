import * as React from 'react';
import type { SVGProps } from 'react';
function SvgStar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M7.04 2.6c.398-.8 1.522-.8 1.92 0l1.112 2.239c.158.319.46.539.807.589l2.447.355c.89.13 1.24 1.245.589 1.875l-1.736 1.679c-.261.252-.38.62-.318.981l.414 2.397c.153.89-.76 1.575-1.55 1.162L8.492 12.71a1.06 1.06 0 0 0-.982 0l-2.235 1.167c-.79.412-1.703-.272-1.549-1.162l.414-2.397a1.1 1.1 0 0 0-.318-.981l-1.736-1.68c-.65-.629-.3-1.745.589-1.874l2.447-.355c.347-.05.649-.27.807-.589z"
      />
    </svg>
  );
}
export default SvgStar;
