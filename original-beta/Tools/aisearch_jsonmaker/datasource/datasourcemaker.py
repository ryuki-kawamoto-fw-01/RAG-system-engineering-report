import csv
import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List


def load_json(filepath: str) -> Dict[str, Any]:
    """JSONファイルを読み込む"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"ファイルが見つかりません: {filepath}")
        return {}
    except json.JSONDecodeError as e:
        print(f"JSON解析エラー: {e}")
        return {}

def save_json(data: Dict[str, Any], filepath: str, indent: int = 2) -> bool:
    """JSONファイルに保存する"""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=indent)
        print(f"保存完了: {filepath}")
        return True
    except Exception as e:
        print(f"保存エラー: {e}")
        return False

def edit_json_value(data: Dict[str, Any], key_path: str, new_value: Any) -> Dict[str, Any]:
    """ネストされたキーを指定して値を編集する
    key_path例: "user.name" または "settings.theme.color"
    """
    keys = key_path.split('.')
    current = data
    
    # 最後のキー以外を辿る
    for key in keys[:-1]:
        if key not in current:
            current[key] = {}
        current = current[key]
    
    # 最後のキーに値を設定
    current[keys[-1]] = new_value
    return data

def add_json_item(data: Dict[str, Any], key: str, value: Any) -> Dict[str, Any]:
    """新しい項目を追加する"""
    data[key] = value
    return data

def delete_json_item(data: Dict[str, Any], key: str) -> Dict[str, Any]:
    """項目を削除する"""
    if key in data:
        del data[key]
        print(f"削除完了: {key}")
    else:
        print(f"キーが見つかりません: {key}")
    return data

def replace_placeholders(data: Any, replacements: Dict[str, str]) -> Any:
    """JSONデータ内の{}で囲まれたプレースホルダーを置換する"""
    if isinstance(data, dict):
        return {k: replace_placeholders(v, replacements) for k, v in data.items()}
    elif isinstance(data, list):
        return [replace_placeholders(item, replacements) for item in data]
    elif isinstance(data, str):
        # {placeholder}形式のパターンを置換
        for key, value in replacements.items():
            data = data.replace(f"{{{key}}}", value)
        return data
    else:
        return data

def update_index_json(template_path: str, output_path: str, replacements: Dict[str, str]) -> bool:
    """index.jsonのテンプレートを読み込み、プレースホルダーを置換して保存する"""
    # テンプレートファイルの存在確認
    if not os.path.exists(template_path):
        print(f"エラー: テンプレートファイルが見つかりません: {template_path}")
        return False
    
    # 出力ディレクトリの存在確認と作成
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        print(f"出力ディレクトリを作成します: {output_dir}")
        os.makedirs(output_dir, exist_ok=True)
    
    # テンプレートファイルを読み込む
    template_data = load_json(template_path)
    if not template_data:
        print(f"エラー: テンプレートファイルの読み込みに失敗しました")
        return False
    
    # プレースホルダーを置換
    updated_data = replace_placeholders(template_data, replacements)
    
    # 置換後のデータを保存
    return save_json(updated_data, output_path)

def load_replacements_from_csv(csv_path: str) -> List[Dict[str, str]]:
    """CSVファイルから置換設定を読み込む
    CSVの1行目はヘッダー(キー名)、2行目以降がデータ
    """
    if not os.path.exists(csv_path):
        print(f"エラー: CSVファイルが見つかりません: {csv_path}")
        print(f"現在のディレクトリ: {os.getcwd()}")
        return []
    
    replacements_list = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # 空の値を除外
                replacements = {k: v for k, v in row.items() if v.strip()}
                if replacements:
                    replacements_list.append(replacements)
        print(f"CSVから{len(replacements_list)}件の設定を読み込みました")
        return replacements_list
    except Exception as e:
        print(f"CSV読み込みエラー: {e}")
        return []

def generate_multiple_jsons(template_path: str, csv_path: str, output_dir: str) -> List[str]:
    """CSVから複数のJSONファイルを生成する"""
    # テンプレートファイルの存在確認
    if not os.path.exists(template_path):
        print(f"エラー: テンプレートファイルが見つかりません: {template_path}")
        return []
    
    # 出力ディレクトリを作成
    os.makedirs(output_dir, exist_ok=True)
    
    # テンプレートを読み込む
    template_data = load_json(template_path)
    if not template_data:
        print(f"エラー: テンプレートの読み込みに失敗しました")
        return []
    
    # CSVから設定を読み込む
    replacements_list = load_replacements_from_csv(csv_path)
    if not replacements_list:
        print(f"エラー: CSVから設定を読み込めませんでした")
        return []
    
    generated_files = []
    
    # 各設定でJSONを生成
    for i, replacements in enumerate(replacements_list, 1):
        # 出力ファイル名を生成(data_source_nameがあればそれを使用)
        if 'data_source_name' in replacements:
            output_filename = f"{replacements['data_source_name']}.json"
        else:
            output_filename = f"datasource_{i}.json"
        
        output_path = os.path.join(output_dir, output_filename)
        
        # プレースホルダーを置換
        updated_data = replace_placeholders(template_data, replacements)
        
        # 保存（メッセージを抑制）
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(updated_data, f, ensure_ascii=False, indent=2)
            generated_files.append(output_path)
            print(f"生成完了 ({i}/{len(replacements_list)}): {output_filename}")
        except Exception as e:
            print(f"生成失敗 ({i}/{len(replacements_list)}): {output_filename} - {e}")
    
    return generated_files

def cleanup_temp_files(file_paths: List[str]) -> None:
    """一時ファイルを削除する"""
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"警告: ファイル削除失敗 {file_path}: {e}")

def create_download_archive(file_paths: List[str], archive_name: str = "generated_jsons.zip") -> str:
    """生成されたJSONファイルをZIPアーカイブにまとめる"""
    import zipfile
    
    try:
        with zipfile.ZipFile(archive_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in file_paths:
                # ファイル名のみをアーカイブ内のパスとして使用
                arcname = os.path.basename(file_path)
                zipf.write(file_path, arcname)
        print(f"アーカイブ作成完了: {archive_name}")
        return archive_name
    except Exception as e:
        print(f"アーカイブ作成エラー: {e}")
        return ""

# 使用例
if __name__ == "__main__":
    print("=" * 60)
    print("Azure AI Search Data Source JSON Generator")
    print("=" * 60)
    
    # スクリプトのディレクトリを取得
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"現在の作業ディレクトリ: {os.getcwd()}")
    print(f"スクリプトのディレクトリ: {script_dir}\n")
    
    # 日付とタイムスタンプを生成
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # ファイルパスの設定（スクリプトディレクトリを基準に）
    template_file = os.path.join(script_dir, "data", "input", "datasource.json")
    csv_file = os.path.join(script_dir, "data", "input", "replacements.csv")
    output_dir = os.path.join(script_dir, "data", "output")
    archive_name = os.path.join(script_dir, "data", "output", f"generated_datasources_{timestamp}.zip")
    
    # ステップ1: テンプレートファイルの確認
    print("【ステップ1】テンプレートファイルの確認")
    if not os.path.exists(template_file):
        print(f"✗ エラー: テンプレートファイルが見つかりません: {template_file}")
        print("data/input/datasource.json ファイルを作成してください。")
        exit(1)
    else:
        print(f"✓ テンプレートファイル確認完了: {template_file}\n")
    
    # ステップ2: CSVファイルの確認
    print("【ステップ2】CSVファイルの確認")
    if not os.path.exists(csv_file):
        print(f"✗ エラー: CSVファイルが見つかりません: {csv_file}")
        print("サンプルCSVファイルを作成します...\n")
        
        # サンプルCSVを作成（datasource用）
        input_dir = os.path.join(script_dir, "data", "input")
        os.makedirs(input_dir, exist_ok=True)
        with open(csv_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['data_source_name', 'storage_account_resource_id', 'container_name', 'folder_name'])
            writer.writerow(['datasource-blob-documents-01', '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-storage-01/providers/Microsoft.Storage/storageAccounts/storage01', 'documents', 'pdf'])
            writer.writerow(['datasource-blob-documents-02', '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-storage-02/providers/Microsoft.Storage/storageAccounts/storage02', 'documents', 'word'])
            writer.writerow(['datasource-blob-documents-03', '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-storage-03/providers/Microsoft.Storage/storageAccounts/storage03', 'rawdata', 'excel'])
        print(f"✓ サンプルCSVファイルを作成しました: {csv_file}")
    else:
        print(f"✓ CSVファイル確認完了: {csv_file}")
    
    # CSVの内容を表示
    replacements_preview = load_replacements_from_csv(csv_file)
    if replacements_preview:
        print(f"  → {len(replacements_preview)}件のデータソース定義が見つかりました\n")
    else:
        print("✗ CSVファイルの読み込みに失敗しました")
        exit(1)
    
    # ステップ3: JSONファイルの生成
    print("【ステップ3】JSONファイルの生成（一時）")
    generated_files = generate_multiple_jsons(template_file, csv_file, output_dir)
    
    if not generated_files:
        print("\n✗ JSONファイルの生成に失敗しました")
        print("以下を確認してください:")
        print(f"  1. テンプレートファイル: {template_file}")
        print(f"  2. CSVファイル: {csv_file}")
        print(f"  3. CSVファイルのフォーマットが正しいか")
        exit(1)
    
    print(f"\n✓ {len(generated_files)}個のJSONファイルを生成しました")
    
    # ステップ4: ZIPアーカイブの作成
    print("\n【ステップ4】ZIPアーカイブの作成")
    archive_path = create_download_archive(generated_files, archive_name)
    
    if archive_path:
        print(f"✓ ZIPアーカイブ作成完了: {archive_path}")
        print(f"  ファイルサイズ: {os.path.getsize(archive_path)} bytes")
        
        # ステップ5: 一時ファイルのクリーンアップ
        print("\n【ステップ5】一時ファイルのクリーンアップ")
        cleanup_temp_files(generated_files)
        print(f"✓ {len(generated_files)}個の一時ファイルを削除しました")
        
        print("\n" + "=" * 60)
        print("処理が完了しました!")
        print(f"保存場所: {os.path.abspath(archive_name)}")
        print(f"ファイル名: {os.path.basename(archive_name)}")
        print(f"ZIPファイル内: {len(generated_files)}個のJSONファイル")
        print("=" * 60)
    else:
        print("✗ ZIPアーカイブの作成に失敗しました")
        # 失敗した場合も一時ファイルをクリーンアップ
        cleanup_temp_files(generated_files)
        exit(1)
