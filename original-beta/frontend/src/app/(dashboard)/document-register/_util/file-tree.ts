import { Item } from '../type';

const fileTreeUtil = {
  // ファイルツリー構造でフォルダパスをしてファイル一覧を取得
  list(tree: Item[], treePath: string[]): Item[] {
    if (treePath.length === 0) {
      return tree;
    }
    const folder = tree.find((p) => p.type === 'folder' && p.name === treePath[0]);
    if (folder?.items) {
      return this.list(folder?.items, treePath.slice(1));
    }
    return [];
  },

  // ファイルのツリー構造にファイルを追加(フォルダがない場合は同時に追加)
  append(
    tree: Item[],
    treePath: string[],
    currentPath: string[],
    itemId: string,
    size: string | undefined,
    updatedAt: string,
    isFolder: boolean = false
  ): Item[] {
    // パスが[]の時は存在しない
    if (treePath.length === 0) {
      throw new Error('treePath must have at least one element');
    }

    // 最も深い階層に到達したらファイルをtree(親フォルダのitems)に追加
    if (treePath.length === 1) {
      const fileExists = tree.some(
        (item) => item.name === treePath[0] && item.type === (isFolder ? 'folder' : 'file')
      );
      if (fileExists) {
        return tree;
      }
      tree.push({
        id: itemId,
        name: treePath[0],
        type: isFolder ? 'folder' : 'file',
        items: isFolder ? [] : undefined,
        size,
        modified: updatedAt,
      });
      return tree;
    }

    // 1つ下の階層へのフォルダを検索
    let folder = tree.find((p) => p.type === 'folder' && p.name === treePath[0]);

    // 1つ下の階層へのフォルダがない場合は新規フォルダを追加
    if (!folder) {
      folder = {
        id: [...currentPath, treePath[0]].join('/'),
        name: treePath[0],
        type: 'folder',
        items: [],
        size: '0 KB',
        modified: new Date().toISOString(),
      };
      tree.push(folder);
    }

    // folder.itemsがundefinedの場合、強制的に[]に変更(基本的には呼ばれることがない想定)
    if (!folder.items) {
      folder.items = [];
    }

    // 再帰呼び出し
    this.append(
      folder.items!,
      treePath.slice(1),
      [...currentPath, treePath[0]],
      itemId,
      size,
      updatedAt,
      isFolder
    );
    return tree;
  },

  // ファイルのツリー構造からファイルを削除
  delete(tree: Item[], treePath: string[]): Item[] {
    // パスが[]の場合は存在しない
    if (treePath.length === 0) {
      throw new Error('treePath must have at least one element');
    }

    // 最深層に到達したらtree(親フォルダのitems)から自身を削除
    if (treePath.length === 1) {
      return tree.filter((item) => item.name !== treePath[0]);
    }

    // 1つ下の階層へのフォルダを検索
    const folder = tree.find((p) => p.type === 'folder' && p.name === treePath[0]);

    if (folder) {
      // 再帰呼び出し
      folder.items = this.delete(folder.items!, treePath.slice(1));
    }
    return tree;
  },

  // 指定されたパスにファイルまたはフォルダが存在するかを確認
  exists(tree: Item[], treePath: string[]): boolean {
    if (treePath.length === 0) {
      return true;
    }
    const folder = tree.find((p) => p.type === 'folder' && p.name === treePath[0]);
    if (folder?.items) {
      return this.exists(folder.items, treePath.slice(1));
    }
    return tree.some((item) => item.name === treePath[0]);
  },

  // ファイルまたはフォルダの名前を変更または移動
  rename(itemId: string, tree: Item[], oldPath: string[], newPath: string[]): Item[] {
    if (oldPath.length === 0 || newPath.length === 0) {
      throw new Error('Both oldPath and newPath must have at least one element');
    }

    // 元のアイテムを取得して削除
    const itemToMove = this.findAndRemove(tree, oldPath);
    if (!itemToMove) {
      throw new Error(`Item at path "${oldPath.join('/')}" not found`);
    }

    // 新しいパスにアイテムを追加
    const newName = newPath[newPath.length - 1];
    itemToMove.name = newName;
    itemToMove.id = itemId;
    itemToMove.modified = new Date().toISOString();

    // 再帰的に新しいパスにアイテムを追加
    this.appendWithItems(tree, newPath, itemToMove);
    return tree;
  },

  // 指定されたパスのアイテムを検索して削除
  findAndRemove(tree: Item[], treePath: string[]): Item | null {
    if (treePath.length === 0) {
      return null;
    }

    if (treePath.length === 1) {
      const index = tree.findIndex((item) => item.name === treePath[0]);
      if (index !== -1) {
        return tree.splice(index, 1)[0];
      }
      return null;
    }

    const folder = tree.find((p) => p.type === 'folder' && p.name === treePath[0]);
    if (folder && folder.items) {
      return this.findAndRemove(folder.items, treePath.slice(1));
    }

    return null;
  },

  // 新しいパスにアイテムを追加する (配下のファイルやフォルダを保持)
  appendWithItems(tree: Item[], treePath: string[], itemToMove: Item): void {
    if (treePath.length === 0) {
      throw new Error('treePath must have at least one element');
    }

    if (treePath.length === 1) {
      // 既存のアイテムがない場合に追加
      const existingItem = tree.find((item) => item.name === treePath[0]);
      if (!existingItem) {
        tree.push(itemToMove);
      }
      return;
    }

    let folder = tree.find((p) => p.type === 'folder' && p.name === treePath[0]);

    if (!folder) {
      // フォルダが存在しない場合、新しいフォルダを作成
      folder = {
        id: treePath[0],
        name: treePath[0],
        type: 'folder',
        items: [],
        size: '0 KB',
        modified: new Date().toISOString(),
      };
      tree.push(folder);
    }

    if (!folder.items) {
      folder.items = [];
    }

    // 再帰的に次の階層に追加
    this.appendWithItems(folder.items, treePath.slice(1), itemToMove);
  },
};

export default fileTreeUtil;
