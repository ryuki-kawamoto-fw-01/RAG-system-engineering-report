import Encoding from 'encoding-japanese';
import { FileIcon, UploadIcon } from 'lucide-react';
import Papa from 'papaparse';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
// import { CheckList } from '../../../app/_types/check-list';
import { Button } from '../../../_components/ui/button';
import { Input } from '../../../_components/ui/input';
import { RowType, headerMapping } from './header';
import DialogButton from './modal';

type ReloadButtonProps = {
  onReload: () => void; // onReloadは関数型で、引数なし、戻り値なし
};

export default function UploadFileDialogButton({ onReload }: ReloadButtonProps) {
  const [displayFileName, setDisplayFileName] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  // const [data, setData] = useState<CheckList[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  function getFormFiles(inputRef: React.RefObject<HTMLInputElement>): File[] {
    const files = inputRef.current?.files;
    const newFiles: File[] = [];
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (file) {
          newFiles.push(file);
        }
      }
    }
    return newFiles;
  }

  function handleFileChange() {
    const files = getFormFiles(fileInputRef);
    if (files.length > 0) {
      setDisplayFileName(files[0]?.name || '');
    }
  }

  function handleUploadDialog(isOpen: boolean) {
    setUploadDialogOpen(isOpen);
    if (!isOpen) {
      setDisplayFileName('');
      setUploading(false);
    }
  }

  async function saveFile(file: File) {
    // const name = file.name;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.type);
    await parseCsvFile(file, (parsedData) => {
      // setData(parsedData);
      localStorage.setItem('checkList', JSON.stringify(parsedData));
      console.log('入力チェックリスト件数：' + parsedData.length);
      onReload();
    });
  }

  async function saveFiles() {
    const newFiles = getFormFiles(fileInputRef).concat(getFormFiles(folderInputRef));
    if (newFiles.length > 0) {
      await saveFile(newFiles[0]);
    }
    toast.success('ファイルアップロードに成功しました。');
    setUploading(false);
  }

  async function clickFileUpload() {
    // const files = getFormFiles(fileInputRef).concat(getFormFiles(folderInputRef));
    // // setCheckFiles(files[0]?.name || '');
    await handleNewFile();
  }

  async function handleNewFile() {
    setUploading(true);
    await saveFiles();
    handleUploadDialog(false);
    setUploading(false);
  }

  const parseCsvFile = async (file: File, callback: (data: unknown[]) => void) => {
    try {
      // ファイルをArrayBufferとして読み込み
      const arrayBuffer = await file.arrayBuffer();

      // 文字コードを検出
      const detectedEncoding = Encoding.detect(new Uint8Array(arrayBuffer));

      // 検出した文字コードに応じてデコード
      let text: string;
      if (detectedEncoding === 'SJIS') {
        const decoder = new TextDecoder('shift_jis');
        text = decoder.decode(arrayBuffer);
      } else {
        const decoder = new TextDecoder('utf-8');
        text = decoder.decode(arrayBuffer);
      }

      // デコードしたテキストをPapaParseで解析
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const mappedData = result.data.map((row) => {
            // rowの型を明示的に指定
            const typedRow = row as RowType;

            const mappedRow: { [key: string]: string } = {};
            for (const key in typedRow) {
              if (headerMapping[key]) {
                // マッピングされた名前を使用
                mappedRow[headerMapping[key]] = typedRow[key];
              } else {
                // マッピングがない場合はそのまま
                mappedRow[key] = typedRow[key];
              }
            }
            return mappedRow;
          });

          callback(mappedData);
        },
      });
    } catch (error) {
      console.error('CSV parsing error:', error);
      toast.error('CSVファイルの読み込みに失敗しました。');
    }
  };

  return (
    <>
      <DialogButton
        open={uploadDialogOpen}
        handleOpen={handleUploadDialog}
        title="新規ファイルの追加"
        description="「ファイル選択」をクリックしてファイルを選択してください。"
        buttonText="チェック一覧取込"
        buttonIcon={<UploadIcon className="mr-2 size-4" />}
      >
        <div>
          <Input
            placeholder="ファイル名"
            value={displayFileName}
            readOnly
            className="grow bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <div className="flex justify-center space-x-4">
          <div className="relative w-1/2">
            <input
              type="file"
              ref={fileInputRef}
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={handleFileChange}
            />
            <Button className="flex w-full items-center justify-center bg-blue-500 text-white hover:bg-blue-600">
              <FileIcon className="mr-2 size-5" />
              <span>ファイル選択</span>
            </Button>
          </div>
        </div>
        <div>
          <ul className="list-inside list-disc text-sm text-gray-500 dark:text-gray-100">
            <li>ファイル選択は1つのみ選択が可能です。</li>
            <li>登録可能ファイル形式：csv</li>
          </ul>
        </div>
        <div className="w-full">
          <Button
            className="flex w-full items-center bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => {
              clickFileUpload();
              // onReload();
            }}
            disabled={!displayFileName || uploading}
          >
            <UploadIcon className="mr-2 size-5" />
            ファイルを追加
          </Button>
        </div>
      </DialogButton>
    </>
  );
}
