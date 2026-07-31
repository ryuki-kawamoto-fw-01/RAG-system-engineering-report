import type { FlowDesignerResult } from '../_store/types';

interface FlowDesignerResultProps {
  result: FlowDesignerResult;
}

export default function FlowDesignerResultDisplay({ result }: FlowDesignerResultProps) {
  if (!result.result) {
    return null;
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 text-lg font-semibold">工程管理表</h3>
      <div className="prose prose-sm max-w-none whitespace-pre-wrap">{result.result}</div>
    </div>
  );
}
