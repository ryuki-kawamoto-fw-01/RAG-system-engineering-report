import os
from typing import List

from azure.storage.blob import BlobProperties

from .const import FOLDER_KEEP_FILE
from .type import Item


# ファイル情報をfileツリーに追加する関数.フォルダがツリーに登録されてない場合はフォルダもツリーへ追加
def append_file_tree(
    parent: List[Item],
    tree_path: List[str],
    fullpath: str,
    size: str | None,
    updated_at: str,
    is_folder: bool,
) -> List[Item]:
    # tree_pathの長さは1以上
    assert 0 < len(tree_path)
    # tree_pathの階層が1のとき自身を返す
    if len(tree_path) == 1:
        new_item = Item(
            id=fullpath,
            name=tree_path[0],
            type="folder" if is_folder else "file",
            items=[] if is_folder else None,
            size=size,
            modified=updated_at,
        )
        same_files = [
            i for i in parent if (new_item.name == i.name) & (new_item.type == i.type)
        ]
        if not same_files:
            parent.append(new_item)
        return parent
    folders = [p for p in parent if (p.type == "folder") & (p.name == tree_path[0])]
    if folders:
        # 同じ階層に同名フォルダーが存在する場合、子に渡す
        folder = folders[0]
    else:
        # 同じ階層に同名フォルダーが存在しない場合、作成して子に渡す
        folder = Item(
            id=fullpath,
            name=tree_path[0],
            type="folder",
            items=[],
            size=None,
            modified="",
        )
        parent.append(folder)
    # folderにitemsがない場合は作成(基本的には呼ばれない)
    if folder.items is None:
        folder.items = []
    # 再帰呼び出しでfolderを渡す
    append_file_tree(
        folder.items,
        tree_path[1:],
        "/".join([fullpath, tree_path[1]]),
        size,
        updated_at,
        is_folder,
    )
    return parent


def rename_keep_file(filename):
    if not os.path.basename(filename) == FOLDER_KEEP_FILE:
        return filename, False
    # フォルダキープファイルの時はディレクトリのみのパス名に変換
    return os.path.dirname(filename), True


# blobの一覧形式のリストをツリー構造に変換
def file_list_to_tree(blobs: List[BlobProperties]) -> List[Item]:
    file_tree = []
    for blob in blobs:
        blob_name, is_folder = rename_keep_file(blob.name)
        file_path = blob_name.split("/")
        append_file_tree(
            file_tree,
            file_path,
            file_path[0],
            str(blob.size),
            blob.last_modified.isoformat(),
            is_folder,
        )
    return file_tree
