import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { uploadFile } from '@/app/_actions/uploadFile';
import { getMessage } from '@/app/_utils/message';

export const handleFileContent = async (
  file: File
): Promise<{ imageSrc: string; fileContent: string | null; fileExtension: string }> => {
  const fileType = file.type;
  let encodedContent = '';
  let imageSrc = '';
  let fileContent: string | null = null;
  let fileExtension = '';

  if (fileType.startsWith('image/')) {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    imageSrc = dataUrl;
  } else {
    try {
      const arrayBuffer = await file.arrayBuffer();
      encodedContent = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      fileContent = encodedContent;
      fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    } catch (error) {
      console.error('Error encoding file content:', error);
    }
  }

  return { imageSrc, fileContent, fileExtension };
};

//2025/06/03 追加 START
export type FileList = { file: File; url: string; name: string; type: string }[];
//2025/06/03 追加 END

export const useFileHandling = (
  initialInput: string,
  setParentInput: Dispatch<SetStateAction<string>>
) => {
  const [fileNamedrag, setFileNamedrag] = useState<string | null>(null);
  //2025/06/03 変更 START
  //  const [files, setFiles] = useState<{ file: File; url: string; name: string; type: string }[]>([]);
  //  const [files, setFiles] = useState<FileList>([]);  const [input, setInput] = useState<string>(initialInput);
  //  const [fileUploading, setFileUploading] = useState<boolean>(false);
  const [files, setFiles] = useState<FileList>([]);
  const [input, setInput] = useState<string>(initialInput);
  const [fileUploading, setFileUploading] = useState<boolean>(false);
  //2025/06/03 変更 END

  const handleFileUpload = async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[acceptedFiles.length - 1];
    console.log('[DEBUG] File upload started:', {
      name: file.name,
      size: file.size,
      originalType: file.type,
    });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', `temp/${file.name}`);

    // MIMEタイプを明示的に正規化
    let mimeType = file.type;
    if (!mimeType && file.name.toLowerCase().endsWith('.jpg')) {
      mimeType = 'image/jpeg';
    } else if (!mimeType && file.name.toLowerCase().endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (!mimeType && file.name.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (!mimeType && file.name.toLowerCase().endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (!mimeType && file.name.toLowerCase().endsWith('.txt')) {
      mimeType = 'text/plain';
    } else if (!mimeType && file.name.toLowerCase().endsWith('.csv')) {
      mimeType = 'text/csv';
    } else if (!mimeType && file.name.toLowerCase().endsWith('.docx')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (!mimeType && file.name.toLowerCase().endsWith('.xlsx')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (!mimeType && file.name.toLowerCase().endsWith('.pptx')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (!mimeType && file.name.toLowerCase().endsWith('.msg')) {
      mimeType = 'application/octet-stream';
    }

    formData.append('type', mimeType);
    console.log('[DEBUG] Uploading with mimeType:', mimeType);
    setFileUploading(true);
    try {
      const res = await uploadFile(formData);
      console.log('[DEBUG] Upload response:', res);
      if (res.success) {
        setFiles([
          {
            file,
            url: res.url,
            name: res.filename,
            type: mimeType,
          },
        ]);
      } else {
        console.error('[DEBUG] Upload failed with response:', res);
        toast.error(getMessage('E_F_00160'));
      }
    } catch (error) {
      console.error('[DEBUG] Upload error:', error);
      toast.error((error as Error).message ?? getMessage('E_F_00160'));
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
    maxSize: 20 * 1024 * 1024,
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
    //2025/06/03 変更 START
    setFileNamedrag(null);
    //2025/06/03 変更 END
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
