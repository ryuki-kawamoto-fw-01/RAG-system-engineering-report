'use client';
import { ActionCreatorWithPayload, Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { cva, VariantProps } from 'class-variance-authority';
import React, { useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { deleteFile } from '@/app/_actions/deleteFile';
import { uploadFile } from '@/app/_actions/uploadFile';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { formatFileSize, splitFileName } from '../_utils/file';
import { cn } from '../_utils/tw-merge';
import SvgClose from './icon/button/Close';
import SvgTextFile from './icon/button/TextFile';
import SvgImage2 from './icon/decorative/Image2';
import { Button } from './ui/button';
import { FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { Input } from './ui/input';

const fileDropAreaVariants = cva(
  'flex cursor-pointer flex-col items-center rounded-[20px] border-2 border-dashed border-neutral-400 bg-slate-100',
  {
    variants: {
      size: {
        sm: 'px-2.5 py-5',
        lg: 'px-2.5 py-10',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

export interface Props
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof fileDropAreaVariants> {
  name: string;
  disabled?: boolean;
  maxSize?: number;
  minSize?: number;
  accept?: Record<string, string[]>;
  uploadPrefix?: string; // ファイルアップロード先のプレフィックス（例: 'temp/text_correction'）
  setRedux?:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | ActionCreatorWithPayload<any, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | ((payload: any) => (dispatch: Dispatch<UnknownAction>) => Promise<void>);
}

export interface FileReference {
  name: string; // ストレージ上のファイルパス
  type: string;
  size: number;
}

export default function FileDropAreaWithTempStorage({
  name,
  size,
  disabled = false,
  maxSize = 20 * 1024 * 1024, // 20MB
  minSize = 1, // 1Byte
  accept = {
    'application/pdf': [],
    'text/plain': [],
    'text/csv': [],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': [],
  },
  uploadPrefix = 'temp',
  className,
  setRedux,
}: Props) {
  const { onChangeField, control, watch } = useFormReduxContext({
    setRedux,
  });
  const files = watch(name, []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadFilesToStorage = async (filesToUpload: File[]) => {
    setUploading(true);
    try {
      const timestamp = new Date().getTime();
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', `${uploadPrefix}/${timestamp}/${file.name}`);
        formData.append('type', file.type);

        const response = await uploadFile(formData);
        if (response.success) {
          return {
            name: response.filename,
            type: file.type,
            size: file.size,
          };
        }
        throw new Error(`Failed to upload file: ${file.name}`);
      });

      const fileReferences: FileReference[] = await Promise.all(uploadPromises);

      // 複数ファイルを一度に追加（forEachではなく一括更新）
      const currentFiles = Array.isArray(files) ? files : [];
      onChangeField({
        [name]: [...currentFiles, ...fileReferences],
      });

      const fileCount = fileReferences.length;
      const message =
        fileCount === 1
          ? getMessage('I_F_00160', fileReferences[0].name.split('/').pop() || 'ファイル')
          : getMessage('I_F_00160', `${fileCount}件のファイル`);
      toast.success(message);
    } catch (error) {
      console.error('Failed to upload files:', error);
      toast.error(getMessage('E_F_00160'));
    }
    setUploading(false);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    await uploadFilesToStorage(acceptedFiles);
  };

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;

    if (selectedFiles && selectedFiles.length > 0) {
      const validFiles: File[] = [];
      for (const file of Array.from(selectedFiles)) {
        if (
          !Object.values(accept)
            .flat()
            .includes(`.${file.name.split('.').pop()?.toLowerCase()}`)
        ) {
          toast.error(getMessage('E_F_00120', file.name, Object.values(accept).flat().join(', ')));
        } else if (file.size > maxSize) {
          toast.error(getMessage('E_F_00130', file.name));
        } else if (file.size < minSize) {
          toast.error(getMessage('E_F_00135', file.name));
        } else {
          validFiles.push(file);
        }
      }
      if (validFiles.length > 0) {
        await uploadFilesToStorage(validFiles);
      }

      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  const removeFile = async (index: number) => {
    const fileToRemove = Array.from(files)[index] as FileReference;
    const fileName = fileToRemove.name.split('/').pop() || fileToRemove.name;

    // まずUIからファイルを削除
    const tmpFiles = Array.from(files).filter((_, i) => i !== index) as FileReference[];
    onChangeField({
      [name]: tmpFiles,
    });

    // バックグラウンドでストレージから削除
    try {
      const result = await deleteFile(fileToRemove.name);
      if (result.success) {
        toast.success(getMessage('I_F_00120', fileName));
      } else {
        toast.error(result.message || getMessage('E_F_00030', fileName));
      }
    } catch (error) {
      console.error('Failed to delete file from storage:', error);
      toast.error(getMessage('E_F_00030', fileName));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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
    disabled: disabled || uploading,
    maxSize,
    minSize,
    accept,
  });

  return (
    <FormField
      control={control}
      name={name}
      render={() => {
        return (
          <FormItem className="space-y-1.5">
            <FormControl>
              <div
                className={cn(
                  fileDropAreaVariants({ size }),
                  isDragActive && 'border-sky-600 bg-sky-100',
                  (disabled || uploading) && 'cursor-not-allowed opacity-50',
                  className
                )}
                {...getRootProps()}
              >
                <div className="flex flex-col items-center">
                  <div className="text-sm font-bold">
                    {uploading ? 'アップロード中...' : 'ここにファイルをドロップ'}
                  </div>
                  <div className="text-2xs">または</div>
                </div>

                <Button
                  type="button"
                  variant="tertiary"
                  size={size === 'lg' ? 'default' : 'sm'}
                  disabled={disabled || uploading}
                  onClick={() => fileRef.current?.click()}
                  className="mt-1.5"
                >
                  ファイルを選択
                </Button>
                <Input
                  type="file"
                  {...getInputProps()}
                  onChange={onChange}
                  ref={fileRef}
                  value={fileRef.current?.value}
                  accept={Object.values(accept).flat().join(',')}
                />
                <div className="mt-1.5 text-left text-2xs font-normal">
                  <div>
                    対応ファイル：
                    {Object.values(accept).flat().join(' ')}
                  </div>
                  <div>{`最大容量：${formatFileSize(maxSize, 0)}`}</div>
                </div>
              </div>
            </FormControl>
            <FormMessage />
            {files.length > 0 && (
              <AttachmentListWithTempStorage files={files} handleDelete={removeFile} />
            )}
          </FormItem>
        );
      }}
    />
  );
}

type AttachmentListProps = {
  files: FileReference[];
  handleDelete: (index: number) => void;
  className?: string;
};

export function AttachmentListWithTempStorage({
  files,
  handleDelete,
  className,
}: AttachmentListProps) {
  return (
    <div className={cn('max-h-[200px] max-w-[400px] space-y-1.5 overflow-y-auto', className)}>
      {files.map((file, index) => {
        const fileName = file.name.split('/').pop() || file.name;
        const { name, ext } = splitFileName(fileName);

        return (
          <div
            key={file.name + index}
            className="flex h-12 w-full items-center gap-x-1.5 rounded-lg border border-slate-200 bg-white py-[7px] pl-1.5 pr-2 text-2xs"
          >
            <div className="rounded bg-sky-100">
              {file.type.startsWith('image/') ? (
                <SvgImage2 className="size-9" />
              ) : (
                <SvgTextFile className="size-9" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center">
                <span className="truncate">{name}</span>
                <span>{ext}</span>
              </div>
              <div className="text-neutral-500">{formatFileSize(file.size)}</div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-4 shrink-0"
              onClick={() => handleDelete(index)}
            >
              <SvgClose />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
