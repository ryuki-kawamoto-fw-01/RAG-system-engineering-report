import mermaid from 'mermaid';
import React, { useEffect, useRef } from 'react';

type MermaidProps = {
  chart: string;
  id?: string;
};

function MermaidChart({ chart, id = 'mermaidChart' }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      mermaid.initialize({ startOnLoad: false });
      // Mermaid v10以降はPromiseベース
      mermaid
        .render(id, chart)
        .then(({ svg }) => {
          const sizedSvg = svg.replace(
            '<svg ',
            '<svg width="700" style="min-width:600px;max-width:100%;margin-left:100px" '
          );
          ref.current!.innerHTML = sizedSvg;
        })
        .catch(() => {
          ref.current!.innerHTML = `<div style="color:red;">Mermaid Syntax Error</div>`;
        });
    }
  }, [chart, id]);

  return (
    <div className="my-4 flex justify-start overflow-x-auto">
      <div ref={ref} />
    </div>
  );
}

export default MermaidChart;
