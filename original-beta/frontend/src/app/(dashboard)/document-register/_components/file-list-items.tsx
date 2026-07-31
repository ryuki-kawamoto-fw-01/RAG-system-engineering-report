type FileListItemsProps = {
  files: string[];
};

export default function FileListItems({ files }: FileListItemsProps) {
  if (files.length === 0) {
    return <></>;
  }

  return (
    <div className="max-h-40 overflow-y-auto">
      <ul className="list-inside list-disc space-y-[9px] text-xs text-neutral-900">
        {files.map((file, index) => (
          <li key={index}>{file}</li>
        ))}
      </ul>
    </div>
  );
}
