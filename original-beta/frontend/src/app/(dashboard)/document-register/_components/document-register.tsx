'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import FileViewer from '@/app/_components/ui/file-viewer';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/app/_components/ui/resizable';
import { Spinner } from '@/app/_components/ui/spinner';
import { getMessage } from '@/app/_utils/message';
import { getFiles } from '../_actions/getFiles';
import ManageFiles from '../_components/manage-files';
import { SidebarMenu } from '../_components/sidebar-menu';
import { Folder } from '../type';

type DocumentRegisterProps = {
  containerName?: string | null;
};

export function DocumentRegister({ containerName }: DocumentRegisterProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileTitle, setFileTitle] = useState<string>('');
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  async function fetchFile(filepath: string, fileSize: number) {
    const fileTitle = filepath.split('/').pop() || '';
    try {
      setIsLoading(true);
      // API Router経由でファイルを取得
      let downloadApiUrl = `/api/get-file-content?filepath=${encodeURIComponent(filepath)}`;
      let previewApiUrl = `/api/get-preview-file-content?filepath=${encodeURIComponent(filepath)}`;
      // 規格登録はプレビューとダウンロードを同じにする
      if (containerName) {
        downloadApiUrl += `&container_name=${encodeURIComponent(containerName)}`;
        previewApiUrl += `&container_name=${encodeURIComponent(containerName)}`;
      }
      if (containerName === process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME) {
        previewApiUrl = downloadApiUrl;
      }
      setFileUrl(previewApiUrl);
      setDownloadUrl(downloadApiUrl);
      setFileTitle(fileTitle);
      setFileSize(fileSize);

      setIsLoading(false);
    } catch (error) {
      setFileTitle(fileTitle);
      console.error('Error fetching file:', error);
      setIsLoading(false);
    }
  }
  const [indexes, setIndexes] = useState<Folder[]>([]);
  const [selectedIndexId, setSelectedIndexId] = useState<string | null>(null);
  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await getFiles('', containerName ?? undefined);
        if (res.success) {
          setIndexes(res.files);
        } else {
          toast.error(getMessage('E_F_00320'));
        }
      } catch (e) {
        console.error('ファイル一覧の取得に失敗しました', e);
        toast.error(getMessage('E_F_00320'));
      }
    }
    fetchFiles();
  }, [selectedIndexId, containerName]);

  const handleIndexSelect = (indexId: string) => {
    setSelectedIndexId(indexId);
  };

  return (
    <div className="flex size-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={17} minSize={10} maxSize={30}>
          <div className="h-full overflow-hidden">
            {indexes.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <SidebarMenu
                key={containerName}
                items={indexes.map((x) => {
                  return { label: x.name, id: x.id };
                })}
                onSelect={handleIndexSelect}
                selectedId={selectedIndexId}
              />
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={43} minSize={20} maxSize={70} className="bg-slate-50">
          <div className="h-full overflow-hidden">
            <ManageFiles
              key={`${containerName}-${selectedIndexId}`}
              selectedIndexId={selectedIndexId}
              initialIndexes={indexes}
              fetchContent={fetchFile}
              containerName={containerName ?? undefined}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
          <div className="h-full overflow-hidden">
            {isLoading ? (
              <div className="flex size-full items-center justify-center">
                <Spinner />
              </div>
            ) : (
              fileUrl && (
                <FileViewer
                  key={containerName}
                  url={fileUrl}
                  downloadUrl={downloadUrl}
                  name={fileTitle}
                  size={fileSize}
                />
              )
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
