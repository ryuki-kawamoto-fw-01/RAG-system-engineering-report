'use client';

import { ChevronRight, Folder } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getFolders, FolderItem } from '@/app/(dashboard)/agent/[task]/[id]/_actions/getFolders';
import { Select, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { Spinner } from '@/app/_components/ui/spinner';
import { cn } from '@/app/_utils/tw-merge';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type FilePrefixSelectorButtonProps = {
  onFilePrefixChange: (selectedFilePrefix: string | null) => void;
  containerName: string;
};

export default function FilePrefixSelectorButton({
  onFilePrefixChange,
  containerName,
}: FilePrefixSelectorButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [folderItems, setFolderItems] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathStack, setPathStack] = useState<string[]>([]);

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getFolders(containerName);
      if (response.success) {
        setFolderItems(response.folders);
        setError(null);
      } else {
        setError(response.error || 'フォルダ情報の取得に失敗しました');
        setFolderItems([]);
      }
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('フォルダ情報の取得中にエラーが発生しました');
      setFolderItems([]);
    } finally {
      setLoading(false);
    }
  }, [containerName]);

  // フォルダ構造を初回のみ取得
  useEffect(() => {
    if (open && folderItems.length === 0) {
      loadFolders();
    }
  }, [open, folderItems.length, loadFolders]);

  // 現在のパス配下のフォルダのみ抽出
  const visibleFolders = useMemo(() => {
    if (!currentPath) {
      // ルート
      return folderItems.filter((f) => !f.path.includes('/') || f.path.split('/').length === 1);
    }
    return folderItems.filter((f) => {
      const parent = f.path.substring(0, f.path.lastIndexOf('/'));
      return parent === currentPath;
    });
  }, [folderItems, currentPath]);

  // 下層にフォルダがあるか判定
  const hasChild = (folder: FolderItem) => {
    return folderItems.some((f) => {
      const parent = f.path.substring(0, f.path.lastIndexOf('/'));
      return parent === folder.path;
    });
  };

  // フォルダ選択
  const handleSelect = (folder: FolderItem) => {
    setSelectedValue(folder.path);
    setSelectedLabel(folder.name);
    onFilePrefixChange(folder.path);
    setOpen(false);
  };

  // 「フォルダ選択を解除」
  const handleClearSelection = () => {
    setSelectedValue(null);
    setSelectedLabel(null);
    onFilePrefixChange(null);
    setOpen(false);
  };

  // 下層へ移動
  const handleEnter = (folder: FolderItem) => {
    setPathStack((prev) => [...prev, currentPath]);
    setCurrentPath(folder.path);
  };

  // 1つ上へ
  const handleBack = () => {
    setCurrentPath(pathStack[pathStack.length - 1] || '');
    setPathStack((prev) => prev.slice(0, -1));
  };

  const buttonText =
    selectedValue === null ? 'フォルダを選択' : `「${selectedLabel}」フォルダ内を検索`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" role="combobox" aria-expanded={open} className="my-1 has-[svg]:p-0">
          <Select>
            <SelectTrigger className="font-base w-60 font-normal">
              <SelectValue placeholder={buttonText} />
            </SelectTrigger>
          </Select>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] bg-white p-0">
        <Command>
          <CommandInput placeholder="フォルダを検索..." />
          {!loading && <CommandEmpty>該当するフォルダはありません</CommandEmpty>}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner className="size-4" />
              <span className="ml-2">フォルダを読み込み中...</span>
            </div>
          ) : error ? (
            <div className="px-2 py-4 text-center text-sm text-red-500">{error}</div>
          ) : (
            <CommandList>
              <CommandGroup heading="フォルダ">
                {/* フォルダ選択を解除 */}
                <CommandItem
                  onSelect={handleClearSelection}
                  className="flex cursor-pointer items-center text-sm text-gray-600 hover:bg-gray-100"
                >
                  <span>フォルダ選択を解除</span>
                </CommandItem>
                {currentPath && (
                  <CommandItem
                    onSelect={handleBack}
                    className="flex cursor-pointer items-center text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <span className="mr-2">..</span>
                    <span>1つ上の階層へ</span>
                  </CommandItem>
                )}
                {visibleFolders.map((folder) => (
                  <div key={folder.path} className="group flex items-center justify-between">
                    <CommandItem
                      value={folder.name}
                      onSelect={() => handleSelect(folder)}
                      className={cn(
                        'flex-1 flex items-center cursor-pointer hover:bg-gray-100',
                        selectedValue === folder.path && 'font-bold'
                      )}
                    >
                      <Folder className="mr-2 size-4" />
                      {folder.name}
                    </CommandItem>
                    {hasChild(folder) && (
                      <button
                        type="button"
                        className="ml-2 cursor-pointer rounded px-2 text-gray-400 hover:bg-gray-100 group-hover:text-blue-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnter(folder);
                        }}
                        tabIndex={-1}
                        aria-label="下の階層へ"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
