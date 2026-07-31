'use server';

import { getTextRegisterAzureFunctions } from '../../../../standard-register/_util/functions';
import { Folder, Item } from '../../../../standard-register/type';

// エージェント用に変換したフォルダアイテムの型定義
export type FolderItem = {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
};

export type FoldersResponse = {
  folders: FolderItem[];
  success: boolean;
  error?: string;
};

// ドキュメントレジスターのフォルダ構造をエージェント用に変換する関数
function convertFolderStructure(folders: Folder[]): FolderItem[] {
  const result: FolderItem[] = [];

  // フォルダとそのアイテムを再帰的に処理
  function processItems(items: Item[] | undefined, parentPath: string = ''): void {
    if (!items) return;

    for (const item of items) {
      if (item.type === 'folder') {
        const path = parentPath ? `${parentPath}/${item.name}` : item.name;
        result.push({
          id: item.id,
          name: item.name,
          path,
          isFolder: true,
        });

        // フォルダ内のアイテムを再帰的に処理
        if (item.items) {
          processItems(item.items, path);
        }
      }
    }
  }

  // 各ルートフォルダを処理
  for (const folder of folders) {
    result.push({
      id: folder.id,
      name: folder.name,
      path: folder.name,
      isFolder: true,
    });

    processItems(folder.items, folder.name);
  }

  return result;
}

export async function getFolders(containerName: string): Promise<FoldersResponse> {
  try {
    const documentRegisterAzureFunctions = getTextRegisterAzureFunctions(containerName);
    const response = await documentRegisterAzureFunctions.sendJson<object, Folder[]>(
      'get-files',
      'POST',
      { prefix: '', container_name: containerName }
    );

    const folderItems = convertFolderStructure(response);
    return {
      folders: folderItems,
      success: true,
    };
  } catch (err) {
    console.error('Error fetching folders:', err);
    return {
      folders: [],
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
