import os
from typing import List


def get_unique_file_name(existing_files: List[str], new_file_name: str) -> str:
    """
    指定されたファイル名が既存のファイル名と重複する場合、ユニークな名前を生成します。
    """
    base_name, extension = os.path.splitext(new_file_name)
    unique_file_name = new_file_name
    counter = 1

    # ファイル名が重複する限り、名前を変更
    while unique_file_name in existing_files:
        unique_file_name = f"{base_name}({counter}){extension}"
        counter += 1

    return unique_file_name
