import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { uploadFile } from '@/app/_actions/uploadFile';
import { getMessage } from '@/app/_utils/message';

export const useFileHandling = (
  initialInput: string,
  setParentInput: Dispatch<SetStateAction<string>>
) => {
  const [fileNamedrag, setFileNamedrag] = useState<string | null>(null);
  const [files, setFiles] = useState<{ file: File; url: string; name: string; type: string }[]>([]);
  const [input, setInput] = useState<string>(initialInput);
  const [fileUploading, setFileUploading] = useState<boolean>(false);

  const handleFileUpload = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[acceptedFiles.length - 1]; // 最後にアップロードされたファイルを取得
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', `temp/${file.name}`);
    formData.append('type', file.type);
    setFileUploading(true);
    try {
      const res = await uploadFile(formData);
      if (res.success) {
        setFiles([
          {
            file,
            url: res.url,
            name: res.filename,
            type: file.type,
          },
        ]); // 将来的には複数ファイル対応
      } else {
        toast.error(getMessage('E_F_00160'));
      }
    } catch (error) {
      console.error(error);
      toast.error(getMessage('E_F_00160'));
    }
    setFileUploading(false);
    setInput((prev) => {
      return [prev, file.name].filter((x) => x !== '').join('\n');
    });
    setParentInput((prev) => {
      return [prev, file.name].filter((x) => x !== '').join('\n');
    });
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleFileUpload,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        rejection.errors.forEach((error) => {
          if (error.code === 'file-too-large') {
            toast.error(getMessage('E_F_00130', rejection.file.name));
          } else if (error.code === 'file-too-small') {
            toast.error(getMessage('E_F_00135', rejection.file.name));
          } else if (error.code === 'file-invalid-type') {
            toast.error(
              getMessage(
                'E_F_00120',
                rejection.file.name,
                [
                  '.jpeg',
                  '.jpg',
                  '.png',
                  '.pdf',
                  '.txt',
                  '.csv',
                  '.docx',
                  '.xlsx',
                  '.pptx',
                  '.msg',
                ].join(', ')
              )
            );
          } else {
            toast.error(getMessage('E_F_00160'));
          }
        });
      });
    },
    noClick: true,
    noKeyboard: true,
    maxSize: 20 * 1024 * 1024,
    minSize: 1,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/octet-stream': ['.msg'],
    },
  });

  const removeFile = useCallback(() => {
    setFiles((prev) => {
      return prev.slice(0, -1);
    });
  }, []);

  return {
    fileUploading,
    fileNamedrag,
    setFileNamedrag,
    input,
    files,
    setFiles,
    setInput: (newInput: string) => {
      setInput(newInput);
      setParentInput(newInput);
    },
    getRootProps,
    getInputProps,
    isDragActive,
    open,
    removeFile,
    handleFileUpload,
  };
};
