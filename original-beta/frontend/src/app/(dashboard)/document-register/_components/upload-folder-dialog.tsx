import { useState } from 'react';
import { toast } from 'sonner';
import { AttachmentList } from '@/app/_components/file-drop-area';
import { Folder as FolderIcon } from '@/app/_components/icon/button';
import { Button } from '@/app/_components/ui/button';
import { getFileFolderPath, getFileFullPath } from '@/app/_utils/file';
import { getMessage } from '@/app/_utils/message';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../_components/ui/dialog';
import { fileSchema } from '../_schemas/file-schema';
import {
  DOCUMENT_REGISTER_ACCEPT_FILE_STRING,
  DOCUMENT_REGISTER_ACCEPT_FILES,
  MAX_DOCUMENT_REGISTER_SIZE,
  STANDARD_REGISTER_ACCEPT_FILE_STRING,
  STANDARD_REGISTER_ACCEPT_FILES,
} from '../_util/constant';
import DuplicateFileDialog from './duplicate-file-dialog';
import FileDropzone from './file-dropzone';

export type UploadFileDialogButtonProps = {
  currentPath: string[];
  saveFile: (file: File, duplicateFileMode: 'overwrite' | 'rename') => Promise<boolean>;
  fileExists: (path: string[]) => boolean;
  isStandardRegister?: boolean;
};

export default function UploadFolderDialogButton({
  currentPath,
  saveFile,
  fileExists,
  isStandardRegister = false,
}: UploadFileDialogButtonProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formFiles, setFormFiles] = useState<File[]>([]);
  const [duplicateFileAction, setDuplicateFileAction] = useState<string | undefined>(undefined);

  const handleFilesAdded = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const folderPath = getFileFolderPath(acceptedFiles[0]);
      const folderName = folderPath[0] ?? '';

      if (folderName.length > 100) {
        toast.error(getMessage('E_F_00280', 'フォルダ名', '100'));
        return;
      }
    }

    const validFiles = acceptedFiles.filter((file) => {
      const validation = fileSchema.safeParse(file.name);
      if (!validation.success) {
        toast.error(`ファイル名が無効です: ${file.name} - ${validation.error.issues[0].message}`);
        return false;
      }
      return true;
    });
    setFormFiles((prev) => {
      const existingFileNames = new Set(prev.map((file) => file.name));
      const newFiles = validFiles.filter((file) => !existingFileNames.has(file.name));
      return [...prev, ...newFiles];
    });
  };

  const handleFilesRemove = (index: number) => {
    setFormFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  async function clickFileUpload() {
    if (formFiles.length === 0) {
      toast.error(getMessage('E_F_00270', 'フォルダ'));
      return;
    }

    const sameFiles: File[] = formFiles.filter((file) =>
      fileExists([...currentPath, ...getFileFolderPath(file), file.name])
    );
    setDuplicateFiles(sameFiles.map((file) => getFileFullPath(file)));
    if (sameFiles.length > 0) {
      handleDuplicateDialog(true);
      return;
    }
    await handleNewFile();
  }

  async function cancelFileUpload() {
    setFormFiles([]);
    setUploadDialogOpen(false);
  }

  function handleUploadDialog(isOpen: boolean) {
    setUploadDialogOpen(isOpen);
    if (!isOpen) {
      cancelFileUpload();
      setUploading(false);
    }
  }

  async function handleDuplicateDialog(isOpen: boolean) {
    setDuplicateDialogOpen(isOpen);
    if (!isOpen) {
      setDuplicateFiles([]);
    }
  }

  async function saveFiles(duplicateFileMode: 'overwrite' | 'rename') {
    let allSuccess = true;
    for (const file of formFiles) {
      const success = await saveFile(file, duplicateFileMode);
      if (!success) {
        allSuccess = false;
      }
    }
    if (allSuccess) {
      toast.success('すべてのファイルのアップロードに成功しました。');
      return;
    }
    setUploading(false);
  }

  async function handleNewFile() {
    setUploading(true);
    await saveFiles('overwrite');
    handleUploadDialog(false);
    setUploading(false);
  }

  async function handleUploadFileOverwrite() {
    setUploading(true);
    await saveFiles('overwrite');
    handleUploadDialog(false);
    handleDuplicateDialog(false);
    setUploading(false);
  }

  async function handleUploadFileRename() {
    setUploading(true);
    await saveFiles('rename');
    handleUploadDialog(false);
    handleDuplicateDialog(false);
    setUploading(false);
  }

  return (
    <>
      <Dialog open={uploadDialogOpen} onOpenChange={handleUploadDialog}>
        <DialogTrigger>
          <span className="flex items-center gap-2">
            <FolderIcon className="size-4" />
            フォルダ
          </span>
        </DialogTrigger>
        <DialogContent className="w-full max-w-[800px]">
          <DialogHeader>
            <DialogTitle>フォルダの追加</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-y-1.5">
            {/* ドロップゾーン */}
            <FileDropzone
              onFilesAdded={handleFilesAdded}
              description="ここにフォルダをドロップ"
              maxFileSize={MAX_DOCUMENT_REGISTER_SIZE}
              acceptFileTypes={
                isStandardRegister
                  ? STANDARD_REGISTER_ACCEPT_FILE_STRING
                  : DOCUMENT_REGISTER_ACCEPT_FILE_STRING
              }
              accept={
                isStandardRegister ? STANDARD_REGISTER_ACCEPT_FILES : DOCUMENT_REGISTER_ACCEPT_FILES
              }
              isFolderUpload={true} // フォルダアップロード用のフラグを設定
            />
            {/* ファイル一覧 */}
            <AttachmentList files={formFiles} handleDelete={handleFilesRemove} />
          </div>

          <DialogFooter>
            <Button
              className="h-[40px] w-[120px] rounded-[20px] border border-neutral-300 bg-white shadow-default"
              variant="tertiary"
              onClick={cancelFileUpload}
            >
              キャンセル
            </Button>
            <Button
              className="h-[40px] w-[120px] rounded-[20px] text-white"
              variant="secondary"
              disabled={uploading}
              onClick={clickFileUpload}
            >
              追加する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DuplicateFileDialog
        isOpen={duplicateDialogOpen}
        duplicateFiles={duplicateFiles}
        duplicateFileAction={duplicateFileAction}
        setDuplicateFileAction={setDuplicateFileAction}
        onClose={() => handleDuplicateDialog(false)}
        onContinue={async (action) => {
          if (action === 'overwrite') {
            await handleUploadFileOverwrite();
          } else if (action === 'rename') {
            await handleUploadFileRename();
          }
        }}
        uploading={uploading}
      />
    </>
  );
}
