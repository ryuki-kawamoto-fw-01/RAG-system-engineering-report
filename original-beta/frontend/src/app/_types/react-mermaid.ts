declare module 'react-mermaid' {
  import * as React from 'react';
  export interface MermaidProps {
    chart: string;
    config?: object;
    name?: string;
    className?: string;
    style?: React.CSSProperties;
  }
  const Mermaid: React.FC<MermaidProps>;
  export default Mermaid;
}
