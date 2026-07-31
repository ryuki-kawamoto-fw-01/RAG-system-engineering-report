import { ActionCreatorWithPayload, Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { cva, VariantProps } from 'class-variance-authority';
import React, { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { uploadFile } from '@/app/(dashboard)/create-manual/_actions/uploadFile';
import { useFieldArray, useFormReduxContext } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { arrayToFileList, formatFileSize, splitFileName } from '../_utils/file';
import { cn } from '../_utils/tw-merge';
import SvgClose from './icon/button/Close';
import SvgTextFile from './icon/button/TextFile';
import { Spinner } from './icon/decorative';
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
  setRedux?:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | ActionCreatorWithPayload<any, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | ((payload: any) => (dispatch: Dispatch<UnknownAction>) => Promise<void>);
}

export default function FileDropArea({
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
    'video/mp4': [],
    'video/avi': [],
    'video/mov': [],
  },
  className,
  setRedux,
}: Props) {
  const { onChangeField, control, watch } = useFormReduxContext({
    setRedux,
  });
  const { append } = useFieldArray({
    name,
    control,
    setRedux,
  });
  const urls = watch(name, []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUpload, setIsUpload] = useState<boolean>(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      append(arrayToFileList(acceptedFiles));
    },
    [append]
  );

  const onChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      setIsUpload(true);

      if (selectedFiles && selectedFiles.length > 0) {
        const validFiles: File[] = [];
        for (const file of Array.from(selectedFiles)) {
          if (
            !Object.values(accept)
              .flat()
              .includes(`.${file.name.split('.').pop()?.toLowerCase()}`)
          ) {
            toast.error(
              getMessage('E_F_00120', file.name, Object.values(accept).flat().join(', '))
            );
          } else if (file.size > maxSize) {
            toast.error(getMessage('E_F_00130', file.name));
          } else if (file.size < minSize) {
            toast.error(getMessage('E_F_00135', file.name));
          } else {
            validFiles.push(file);
          }
        }
        if (validFiles.length > 0) {
          // upload api
          const formData = new FormData();
          formData.append('file', validFiles[0]);
          const data = await uploadFile(formData);
          onChangeField({ [name]: [...urls, data.url] });
          setIsUpload(false);
          // onChangeField({ [name]: arrayToFileList(validFiles) });
        }

        if (fileRef.current) {
          fileRef.current.value = '';
        }
      }
    },
    [fileRef, name, onChangeField, maxSize, minSize]
  );

  const removeFile = (index: number) => {
    const tmpFiles = Array.from(urls).filter((_, i) => i !== index) as string[];
    onChangeField({
      [name]: tmpFiles,
    });
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
    disabled,
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
                  disabled || isUpload ? 'cursor-not-allowed opacity-50' : '',
                  className
                )}
                {...getRootProps()}
              >
                <div className="flex flex-col items-center">
                  <div className="text-sm font-bold">ここにファイルをドロップ</div>
                  <div className="text-2xs">または</div>
                </div>

                <Button
                  type="button"
                  variant="tertiary"
                  size={size === 'lg' ? 'default' : 'sm'}
                  disabled={disabled || isUpload}
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
                {isUpload && (
                  <div className="mt-2 flex items-center justify-center">
                    <Spinner className="mr-2 size-4 animate-spin text-slate-700" />
                    <span className="text-sm">アップロード中...</span>
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
            {urls.length > 0 && <AttachmentList files={urls} handleDelete={removeFile} />}
          </FormItem>
        );
      }}
    />
  );
}

type AttachmentListProps = {
  files: string[];
  handleDelete: (index: number) => void;
  className?: string;
};

export function AttachmentList({ files, handleDelete, className }: AttachmentListProps) {
  return (
    <div className={cn('space-y-1.5 max-h-[200px] max-w-[400px] overflow-y-auto', className)}>
      {Array.from(files).map((file, index) => {
        // https://stdevcopilot01.blob.core.windows.net/{コンテナー名}/{uuid}/{filename}
        const url = file.split('?')[0];
        const urlParts = url.split('/');
        const { name, ext } = splitFileName(urlParts.pop()!);

        return (
          <div
            key={name}
            className="flex h-12 w-full items-center gap-x-1.5 rounded-lg border border-slate-200 bg-white py-[7px] pl-1.5 pr-2 text-2xs"
          >
            <div className="rounded bg-sky-100">
              <SvgTextFile className="size-9" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center">
                <span className="truncate">{name}</span>
                <span>{ext}</span>
              </div>
              {/* <div className="text-neutral-500">{formatFileSize(file.size)}</div> */}
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
