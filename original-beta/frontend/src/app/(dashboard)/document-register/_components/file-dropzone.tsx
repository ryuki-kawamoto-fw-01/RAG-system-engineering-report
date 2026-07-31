import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { toast } from 'sonner';
import { Button } from '@/app/_components/ui/button';
import { formatFileSize } from '@/app/_utils/format-file-size';
import { getMessage } from '@/app/_utils/message';
import { DOCUMENT_REGISTER_ACCEPT_FILES } from '../_util/constant';

type FileDropzoneProps = DropzoneOptions & {
  onFilesAdded: (files: File[]) => void;
  description: string;
  maxFileSize: number;
  acceptFileTypes: string;
  isFolderUpload?: boolean;
};

export default function FileDropzone({
  onFilesAdded,
  description,
  maxFileSize,
  acceptFileTypes,
  isFolderUpload = false,
  accept = DOCUMENT_REGISTER_ACCEPT_FILES,
  ...dropzoneOptions
}: FileDropzoneProps) {
  const { getRootProps, getInputProps } = useDropzone({
    ...dropzoneOptions,
    onDrop: (acceptedFiles) => {
      onFilesAdded(acceptedFiles);
    },
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        rejection.errors.forEach((error) => {
          const allowedExtensions = Object.values(accept).flat().join(', ');
          if (error.code === 'file-too-large') {
            toast.error(getMessage('E_F_00130', rejection.file.name));
          } else if (error.code === 'file-too-small') {
            toast.error(getMessage('E_F_00135', rejection.file.name));
          } else if (error.code === 'file-invalid-type') {
            toast.error(getMessage('E_F_00120', rejection.file.name, allowedExtensions));
          } else {
            toast.error(getMessage('E_F_00160'));
          }
        });
      });
    },
    accept,
    maxSize: maxFileSize,
    minSize: 1, // 1Byte
  });

  return (
    <div
      {...getRootProps()}
      className="flex flex-col items-center justify-center gap-y-1.5 rounded-2xl border-2 border-dashed border-neutral-400 bg-slate-50 p-10"
    >
      <input
        {...getInputProps()}
        // フォルダアップロードの場合に`directory`と`webkitdirectory`を設定
        {...(isFolderUpload && {
          directory: '',
          webkitdirectory: '',
        })}
      />
      <div className="text-center text-sm font-bold leading-5 text-neutral-900">{description}</div>
      <div className="text-center text-xs font-normal leading-4 text-neutral-900">または</div>
      <Button variant="tertiary" className="w-[200px]">
        {isFolderUpload ? 'フォルダを選択' : 'ファイルを選択'}
      </Button>
      <div className="text-left text-2xs font-normal">
        <div>{`対応ファイル：${acceptFileTypes}`}</div>
        <div>{`最大容量：${formatFileSize({ bytes: maxFileSize, round: 0 })}`}</div>
        <div>※複数ファイルを一括アップロード可能です。</div>
        <div>※アップロードから文書検索で検索できるようになるまで5~15分ほどかかります。</div>
        <div>※ラベルや暗号化によって保護されたファイルは登録できません。</div>
        <div>
          ※登録処理に失敗したファイルは自動的に削除されます。ファイルの状態をご確認のうえ、再度登録してください。
        </div>
      </div>
    </div>
  );
}
