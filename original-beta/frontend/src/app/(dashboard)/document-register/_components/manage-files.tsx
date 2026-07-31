'use client';

import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  flexRender,
  getFilteredRowModel,
  FilterFn,
} from '@tanstack/react-table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SortDropdown from '@/app/_components/dropdown/sort-dropdown';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Delete,
  Download,
  File as FileIcon,
  Folder as FolderIcon,
  Upload,
} from '@/app/_components/icon/button';
import SearchBox from '@/app/_components/search-box';
import { Checkbox } from '@/app/_components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import { Label } from '@/app/_components/ui/label';
import { getFileFolderPath, getUniqueFileName } from '@/app/_utils/file';
import { formatFileSize } from '@/app/_utils/format-file-size';
import { getMessage } from '@/app/_utils/message';
import { truncateString } from '@/app/_utils/truncate-string';
import { Button } from '../../../_components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../_components/ui/table';
import { createFolder } from '../_actions/createFolder';
import { deleteFile } from '../_actions/deleteFile';
import { downloadFolder } from '../_actions/downloadFolder';
import { renameFile } from '../_actions/rename-file';
import { renameFolder } from '../_actions/rename-folder';
import { rmTree } from '../_actions/rmTree';
import { uploadFile } from '../_actions/uploadFile';
import { mapIndexNameByLabel } from '../_util/category-display';
import fileTreeUtil from '../_util/file-tree';
import { Folder, Item } from '../type';
import AddFolderDialogButton from './add-folder-dialog-button';
import ItemNameCell from './item-name-cell';
import RenameDialog from './rename-dialog';
import UploadFileDialogButton from './upload-file-dialog';
import UploadFolderDialogButton from './upload-folder-dialog';

type Props = {
  selectedIndexId: string | null;
  initialIndexes: Folder[];
  fetchContent: (filepath: string, fileSize: number) => void;
  containerName?: string;
};

export default function ManageFiles({
  selectedIndexId,
  initialIndexes,
  fetchContent,
  containerName,
}: Props) {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<Folder | undefined>(
    initialIndexes.find((index) => index.id === selectedIndexId)
  );
  const [currentItems, setCurrentItems] = useState<Item[]>([]);
  const [rowSelection, setRowSelection] = useState<{ [key: string]: boolean }>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [renameDialogState, setRenameDialogState] = useState<{
    isOpen: boolean;
    item: Item | undefined;
  }>({
    isOpen: false,
    item: undefined,
  });

  const isStandardRegister =
    containerName === process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME;

  const handleFolderClick = (folderName: string) => {
    setCurrentPath((prev) => [...prev, folderName]);
  };

  async function handleDownload(itemId: string) {
    try {
      let apiUrl = `/api/get-file-content?filepath=${encodeURIComponent(itemId)}`;
      if (containerName) {
        apiUrl += `&container_name=${encodeURIComponent(containerName)}`;
      }
      const fileResponse = await fetch(apiUrl);
      const blob = await fileResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = itemId.split('/').pop() || 'download';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      toast.success(getMessage('I_F_00130', 'ファイル'));
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(getMessage('E_F_00360', 'ファイル'));
      return false;
    }
  }

  async function handleDownloadFolder(folderId: string) {
    const toastId = toast.loading(getMessage('W_F_00050'));
    try {
      const res = await downloadFolder(folderId, containerName);
      if (!res.success) {
        if (res.statusCode === 404) {
          toast.error(getMessage('E_F_00380', 'フォルダ'));
          return false;
        }
        console.error(res.message);
        toast.error(getMessage('E_F_00360', 'フォルダ'));
        return false;
      }

      const base64 = res.data;
      const binary = atob(base64);
      const blob = new Blob([new Uint8Array(binary.split('').map((char) => char.charCodeAt(0)))], {
        type: 'application/zip',
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${folderId.split('/').pop() || 'folder'}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      toast.success(getMessage('I_F_00130', 'フォルダ'));
      return true;
    } catch (error) {
      console.error(error);
      toast.error(getMessage('E_F_00370'));
      return false;
    } finally {
      toast.dismiss(toastId);
    }
  }

  const listItems = React.useCallback(
    (path: string[]): Item[] => {
      if (!selectedIndex) {
        return [];
      }
      const items = fileTreeUtil.list(selectedIndex.items, path);
      return items;
    },
    [selectedIndex]
  );

  function fileExists(path: string[]): boolean {
    if (!selectedIndex) {
      return false;
    }
    return fileTreeUtil.exists(selectedIndex.items, path);
  }

  const updateCurrentItems = React.useCallback(() => {
    const currentItems = listItems(currentPath);

    // 重複を取り除く処理
    const uniqueItems = Array.from(new Set(currentItems.map((item) => item.name)))
      .map((name) => {
        return currentItems.find((item) => item.name === name);
      })
      .filter((item) => item !== undefined) as Item[];

    const newFileItems = uniqueItems.sort((item1, item2) => {
      if (item1.type === 'folder' && item2.type !== 'folder') return -1;
      if (item1.type !== 'folder' && item2.type === 'folder') return 1;
      return 0;
    });

    setCurrentItems(newFileItems);
  }, [currentPath, listItems]);

  function appendItemToSelectedIndex(item: Item) {
    setSelectedIndex((prev) => {
      if (prev && selectedIndexId) {
        const newItems = fileTreeUtil.append(
          prev.items,
          item.id.split('/').slice(1), // インデックスX/より後をパスとして渡す
          [selectedIndexId],
          item.id,
          item.size,
          item.modified,
          item.type === 'folder'
        );
        prev.items = newItems;
      }
      return prev;
    });
    updateCurrentItems();
  }

  function deleteItemSelectedIndex(itemId: string) {
    setSelectedIndex((prev) => {
      if (prev) {
        const newItems = fileTreeUtil.delete(prev.items, itemId.split('/').slice(1));
        prev.items = newItems;
      }
      return prev;
    });
    updateCurrentItems();
  }

  function renameItemSelectedIndex(itemId: string, newItem: Item) {
    if (!selectedIndex) {
      return;
    }
    if (!selectedIndexId) {
      return;
    }
    const newItemFullPath =
      currentPath.length > 0
        ? `${selectedIndexId}/${currentPath.join('/')}/${newItem.name}`
        : `${selectedIndexId}/${newItem.name}`;
    fileTreeUtil.rename(
      newItemFullPath,
      selectedIndex.items,
      itemId.split('/').slice(1),
      newItem.id.split('/').slice(1)
    );
  }

  async function handleDeleteItem(itemId: string) {
    const res = await deleteFile(itemId, containerName);
    if (res.success) {
      deleteItemSelectedIndex(itemId);
      toast.success(getMessage('I_F_00120', 'ファイル'));
    } else {
      toast.error(getMessage('E_F_00350', 'ファイル'));
    }
  }

  async function handleDeleteFolder(itemId: string) {
    const res = await rmTree(itemId + '/', containerName);
    if (res.success) {
      deleteItemSelectedIndex(itemId);
      toast.success(getMessage('I_F_00120', 'フォルダ'));
    } else {
      toast.error(getMessage('E_F_00350', 'フォルダ'));
    }
  }
  async function handleRenameFolder(folderId: string, newName: string) {
    const response = await renameFolder(folderId, newName, containerName);
    if (!response.success) {
      throw new Error(response.message || 'フォルダ名の変更に失敗しました。');
    }
  }

  async function handleRenameItem(itemId: string, newName: string) {
    const response = await renameFile(itemId, newName, containerName);
    if (!response.success) {
      throw new Error(response.message || 'ファイル名の変更に失敗しました。');
    }
  }

  const handleRename = async (item: Item, newItemName: string) => {
    try {
      const oldItemFullPath =
        currentPath.length > 0
          ? `${selectedIndexId}/${currentPath.join('/')}/${item.name}`
          : `${selectedIndexId}/${item.name}`;
      const newItemFullPath =
        currentPath.length > 0
          ? `${selectedIndexId}/${currentPath.join('/')}/${newItemName}`
          : `${selectedIndexId}/${newItemName}`;
      if (fileExists(newItemFullPath.split('/').slice(1))) {
        toast.error(getMessage('E_F_00305', 'ファイル'));
        return;
      }

      // リネーム前のrowSelectionを記録
      const wasSelected = !!rowSelection[item.id];

      renameItemSelectedIndex(item.id, {
        id: newItemFullPath,
        name: newItemName,
        size: item.size,
        modified: new Date().toISOString(),
        type: item.type,
      });
      if (item.type === 'folder') {
        await handleRenameFolder(oldItemFullPath, newItemFullPath);
        toast.success(getMessage('I_F_00110', 'フォルダ'));
      } else {
        await handleRenameItem(oldItemFullPath, newItemFullPath);
        toast.success(getMessage('I_F_00110', 'ファイル'));
      }

      // リネーム後のcurrentItemsを取得
      updateCurrentItems();
      if (wasSelected) {
        setRowSelection((prev) => {
          const updated = { ...prev };
          delete updated[item.id]; // 旧idの選択を解除
          updated[newItemFullPath] = true; // 新idで選択
          return updated;
        });
      }
    } catch (error) {
      console.error('Error renaming item:', error);
      toast.error(getMessage('E_F_00340', item.type === 'folder' ? 'フォルダ' : 'ファイル'));
    }
    setRenameDialogState({ isOpen: false, item: undefined });
  };

  useEffect(() => {
    updateCurrentItems();
  }, [currentPath, updateCurrentItems]);

  const handleDeleteSelected = async () => {
    const selectedItems = Object.keys(rowSelection)
      .map((rowId) => table.getRowModel().rows.find((row) => row.id === rowId)?.original)
      .filter(Boolean) as Item[];
    const promises = selectedItems.map((item) => {
      if (item.type === 'folder') {
        return handleDeleteFolder(item.id);
      }
      return handleDeleteItem(item.id);
    });
    await Promise.all(promises);
    setRowSelection({});
  };

  const handleDownloadSelected = async () => {
    const selectedItems = Object.keys(rowSelection)
      .map((rowId) => table.getRowModel().rows.find((row) => row.id === rowId)?.original)
      .filter(Boolean) as Item[];
    const promises = selectedItems.map((item) => {
      if (item.type === 'folder') {
        return handleDownloadFolder(item.id);
      }
      return handleDownload(item.id);
    });
    const results = await Promise.all(promises);
    setRowSelection({});
    if (results.every((result) => result)) {
      toast.success(getMessage('I_F_00140'));
    }
  };

  async function createFolderRecursively(folderRelativePath: string[]) {
    const newFolderPath = [selectedIndexId];
    const createdFolders: string[] = [];
    for (const folder of folderRelativePath) {
      newFolderPath.push(folder);
      const folderBlobName = newFolderPath.join('/');
      // すでに作成済みのフォルダはスキップ
      if (!createdFolders.includes(folderBlobName)) {
        await createFolder(folderBlobName, containerName);
        createdFolders.push(folderBlobName);
        appendItemToSelectedIndex({
          id: folderBlobName,
          name: folder,
          type: 'folder',
          size: '0kb',
          modified: new Date().toISOString(),
        });
      }
    }
  }

  async function saveFile(
    file: File,
    duplicateFileMode: 'overwrite' | 'rename',
    isFolderUpload: boolean
  ) {
    // ファイル名にセミコロンが含まれている場合はエラー
    if (file.name.includes(';')) {
      toast.error(`ファイル名に「;」を含むファイルはアップロードできません: ${file.name}`);
      return false;
    }

    let name = file.name;
    let folderFullPath = currentPath;
    if (isFolderUpload) {
      folderFullPath = [...currentPath, ...getFileFolderPath(file)];
      await createFolderRecursively(folderFullPath);
    }
    const currentItems = listItems(folderFullPath);
    const currentItemNames = currentItems.map((item) => item.name);
    if (duplicateFileMode === 'rename' && currentItemNames.includes(name)) {
      name = getUniqueFileName(currentItemNames, name);
    }
    const blobName = [selectedIndexId, ...folderFullPath, name].join('/');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', blobName);
    formData.append('type', file.type);
    if (containerName) {
      formData.append('container_name', containerName);
    }
    try {
      const res = await uploadFile(formData);
      if (res.success) {
        if (!currentItemNames.includes(name)) {
          appendItemToSelectedIndex({
            id: blobName,
            name,
            type: 'file',
            size: file.size.toString(),
            modified: new Date().toISOString(),
          });
          toast.success(getMessage('I_F_00100', 'ファイル'));
        }
        return true;
      }
      toast.error(`${name}のアップロードに失敗しました。`);
      return false;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    }
  }

  const columns: ColumnDef<Item>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Label className="flex size-8 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-neutral-900/[4%]">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="全て選択"
          />
        </Label>
      ),
      cell: ({ row }) => (
        <Label className="flex size-8 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-neutral-900/[4%]">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`選択 ${row.original.name}`}
          />
        </Label>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        const sortStatus = column.getIsSorted();
        return (
          <SortDropdown
            label="名前"
            sortStatus={sortStatus}
            handleUp={() => column.toggleSorting(false)}
            handleDown={() => column.toggleSorting(true)}
          />
        );
      },
      cell: ({ row }) => (
        <ItemNameCell
          icon={row.original.type === 'folder' ? FolderIcon : FileIcon}
          name={row.original.name}
          onRename={() =>
            setRenameDialogState({
              isOpen: true,
              item: row.original,
            })
          }
          onClick={
            row.original.type === 'folder'
              ? () => handleFolderClick(row.original.name)
              : () =>
                  fetchContent(
                    row.original.id,
                    row.original.size ? parseFloat(row.original.size) : 0
                  )
          }
          onDelete={
            row.original.type === 'folder'
              ? () => handleDeleteFolder(row.original.id)
              : () => handleDeleteItem(row.original.id)
          }
          onDownload={
            row.original.type === 'folder'
              ? () => handleDownloadFolder(row.original.id)
              : () => handleDownload(row.original.id)
          }
        />
      ),
    },
    {
      accessorKey: 'modified',
      header: ({ column }) => {
        const sortStatus = column.getIsSorted();
        return (
          <SortDropdown
            label="最終更新日"
            sortStatus={sortStatus}
            handleUp={() => column.toggleSorting(false)}
            handleDown={() => column.toggleSorting(true)}
          />
        );
      },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-neutral-500">
          {row.original.modified ? dayjs(row.original.modified).format('YYYY/MM/DD') : ''}
        </span>
      ),
    },
    {
      accessorKey: 'size',
      header: ({ column }) => {
        const sortStatus = column.getIsSorted();
        return (
          <SortDropdown
            label="容量"
            sortStatus={sortStatus}
            handleUp={() => column.toggleSorting(false)}
            handleDown={() => column.toggleSorting(true)}
          />
        );
      },
      cell: ({ row }) => (
        <span className="min-w-[60px] overflow-hidden truncate text-xs text-neutral-500">
          {row.original.type === 'file' &&
            formatFileSize({
              bytes: row.original.size ? parseFloat(row.original.size) : undefined,
            })}
        </span>
      ),
    },
  ];

  const fileNameFilter: FilterFn<Item> = (row, columnId, filterValue) => {
    // nameカラムのみを検索対象にする
    const cellValue = row.getValue('name');
    if (typeof cellValue !== 'string') return false;

    // localeCompareを使用して日本語の比較を行う
    return (
      cellValue.localeCompare(filterValue, 'ja', { sensitivity: 'base' }) === 0 ||
      cellValue.includes(filterValue)
    );
  };

  const table = useReactTable({
    data: currentItems,
    columns,
    state: {
      rowSelection,
      sorting,
      globalFilter: searchTerm,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearchTerm,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: fileNameFilter,
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex size-full flex-col gap-y-1 px-6 py-3">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Heading level={3} className="flex gap-x-[2px]">
            {containerName === process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME
              ? '規格/設計書登録'
              : '文書登録'}
            <Help
              message={
                isStandardRegister
                  ? '規格検索・設計書チェック画面での検索対象となる規格・設計基準書を登録する画面です。'
                  : '文書検索画面での検索対象となる文書を登録する画面です。'
              }
            />
          </Heading>
          <div className="flex space-x-2">
            <AddFolderDialogButton
              selectedIndexId={selectedIndexId}
              currentPath={currentPath}
              currentItems={currentItems}
              appendItemToSelectedIndex={appendItemToSelectedIndex}
              containerName={containerName}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" disabled={!selectedIndex}>
                  <Upload className="size-4 text-white" />
                  <span className="text-sm font-light text-white">登録</span>
                  <ChevronDown className="size-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault(); // モーダル表示のためメニューが閉じないようにする
                  }}
                >
                  <UploadFileDialogButton
                    currentPath={currentPath}
                    saveFile={(file, mode) => saveFile(file, mode, false)}
                    fileExists={fileExists}
                    isStandardRegister={isStandardRegister}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault(); // モーダル表示のためメニューが閉じないようにする
                  }}
                >
                  <UploadFolderDialogButton
                    currentPath={currentPath}
                    saveFile={(file, mode) => saveFile(file, mode, true)}
                    fileExists={fileExists}
                    isStandardRegister={isStandardRegister}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {selectedIndex && (
          <>
            <SearchBox
              className="py-0"
              placeholder={`${mapIndexNameByLabel(selectedIndex.name)}内を検索`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
            />
            <div className="mb-2 flex items-center">
              <Button
                onClick={() => {
                  setCurrentPath((prev) => prev.slice(0, currentPath.length - 1));
                }}
                size="text"
                variant="text"
                className="p-0 has-[svg]:pl-0"
                disabled={currentPath.length === 0}
                aria-label="戻る"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="flex items-center overflow-x-auto">
                {[mapIndexNameByLabel(selectedIndex.name), ...currentPath].map((val, index) => {
                  const isLast = index === currentPath.length;

                  return (
                    <React.Fragment key={index}>
                      {isLast ? (
                        <div className="text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                          {truncateString(val, 10)}
                        </div>
                      ) : (
                        <>
                          <Button
                            onClick={() => {
                              setCurrentPath((prev) => prev.slice(0, index));
                            }}
                            size="text"
                            variant="text"
                            disabled={currentPath.length === 0}
                            aria-label={val}
                            className="p-0 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                          >
                            {truncateString(val, 10)}
                          </Button>
                          <ChevronRight className="size-3 text-neutral-400" />
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <div className="mb-1 flex space-x-1">
              <Button
                size="sm"
                variant="tertiary"
                onClick={handleDownloadSelected}
                disabled={Object.keys(rowSelection).length === 0}
              >
                <Download className="size-4" />
                ダウンロード
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                onClick={handleDeleteSelected}
                disabled={Object.keys(rowSelection).length === 0}
              >
                <Delete className="size-4" />
                削除
              </Button>
            </div>
          </>
        )}
      </div>
      {selectedIndex && (
        <div className="max-h-[calc(100vh-250px)] overflow-x-auto">
          <Table className="size-full min-w-[500px] table-fixed">
            <colgroup>
              <col style={{ width: '40px' }} />
              <col />
              <col style={{ width: '120px' }} />
              <col style={{ width: '80px' }} />
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-white dark:bg-gray-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-2 py-[3px]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-[calc(100vh-300px)] text-center">
                    データがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {renameDialogState.item && (
        <RenameDialog
          isOpen={renameDialogState.isOpen}
          item={renameDialogState.item}
          onRename={handleRename}
          onClose={() => setRenameDialogState({ isOpen: false, item: undefined })}
        />
      )}
    </div>
  );
}
