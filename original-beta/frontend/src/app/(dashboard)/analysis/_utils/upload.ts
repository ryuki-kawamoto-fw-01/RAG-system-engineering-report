import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { uploadFile } from '@/app/_actions/uploadFile';
import { FileList } from '../../chat/[id]/_components/chat-utils';

export const handleFileContent = async (
  file: File
): Promise<{ fileContent: string | null; fileExtension: string }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const encodedContent = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    return { fileContent: encodedContent, fileExtension };
  } catch (error) {
    console.error('Error encoding file content:', error);
    return { fileContent: null, fileExtension: '' };
  }
};

export const convertFileToBase64 = (file: {
  file: File;
  url: string;
  name: string;
  type: string;
}): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file.file);
    reader.onload = () => {
      if (reader.result) {
        const base64Data = reader.result.toString().split(',')[1];
        resolve(base64Data);
      } else {
        reject(new Error('Failed to convert file to Base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const useFileHandling = (
  initialInput: string,
  setParentInput: Dispatch<SetStateAction<string>>
) => {
  const [fileNamedrag, setFileNamedrag] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList>([]);
  const [input, setInput] = useState<string>(initialInput);
  const [fileUploading, setFileUploading] = useState<boolean>(false);

  const handleFileUpload = async (acceptedFiles: File[]) => {
    // ファイルが存在しない場合,対応していないファイルの場合エラー
    if (!acceptedFiles || acceptedFiles.length === 0) {
      toast.error('ファイルのアップロードに失敗しました。');
      return;
    }

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
        ]);
      } else {
        toast.error('ファイルのアップロードに失敗しました。');
      }
    } catch (error) {
      console.error(error);
      toast.error('ファイルのアップロードに失敗しました。');
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
    noClick: true,
    noKeyboard: true,
    maxSize: 40 * 1024 * 1024,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const removeFile = useCallback(() => {
    setFileNamedrag(null);
    setFiles([]);
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
    handleFileContent: (file: File) =>
      handleFileContent(file).then(() => {
        setFileNamedrag(file.name);
        setInput((prev) => {
          return [prev, file.name].filter((x) => x !== '').join('\n');
        });
        setParentInput((prev) => {
          return [prev, file.name].filter((x) => x !== '').join('\n');
        });
      }),
  };
};
