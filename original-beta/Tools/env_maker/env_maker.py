import json
import platform
import subprocess
from pathlib import Path


def get_az_command():
    """環境に応じたAzure CLIコマンド名を取得"""
    if platform.system() == 'Windows':
        return 'az.cmd'
    return 'az'


def load_mapping(file_path):
    """環境変数入力.txtから値のマッピングを読み込む"""
    mapping = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '：' in line:
                parts = line.split('：', 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    value = parts[1].strip()
                    mapping[key] = value
    return mapping

def load_template_values(file_path):
    """テンプレート設定.txtからテンプレート値（置換元）を読み込む"""
    template_values = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '：' in line:
                parts = line.split('：', 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    value = parts[1].strip()
                    template_values[key] = value
    return template_values

def create_replacement_map(template_values, actual_values):
    """テンプレート値から実際の値への置換マップを作成"""
    replacement_map = {}
    for key in template_values:
        if key in actual_values:
            old_value = template_values[key]
            new_value = actual_values[key]
            # "ここに実際の"で始まる値はスキップ（未入力）
            if not new_value.startswith('ここに実際の'):
                replacement_map[old_value] = new_value
    return replacement_map

def replace_json_values(json_data, replacement_map):
    """JSONデータの値を置換マップに基づいて置換（部分一致も含む）"""
    replaced_count = 0
    for item in json_data:
        original_value = item['value']
        
        # 完全一致チェック
        if original_value in replacement_map:
            item['value'] = replacement_map[original_value]
            replaced_count += 1
        else:
            # 部分一致チェック（URL内のストレージアカウント名など）
            modified = False
            new_value = original_value
            for old_val, new_val in replacement_map.items():
                if old_val in new_value and old_val != new_val:
                    new_value = new_value.replace(old_val, new_val)
                    modified = True
            
            if modified:
                item['value'] = new_value
                replaced_count += 1
    
    return json_data, replaced_count

def process_json_files(json_dir, replacement_map, output_dir, target_files):
    """jsonフォルダ内の指定されたJSONファイルを処理"""
    # 指定されたファイルのみ処理
    json_files = [json_dir / f"{filename}.json" for filename in target_files]
    
    # 存在しないファイルを除外
    existing_files = [f for f in json_files if f.exists()]
    
    if not existing_files:
        print(f"警告: 指定されたJSONファイルが見つかりません")
        return
    
    # 出力ディレクトリが存在しない場合は作成
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{len(existing_files)}個のJSONファイルを処理します...")
    print(f"出力先: {output_dir}")
    
    total_replaced = 0
    
    for json_file in existing_files:
        print(f"\n処理中: {json_file.name}")
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
            
            replaced_data, count = replace_json_values(json_data, replacement_map)
            total_replaced += count
            
            # 出力先のパスを作成
            output_file = output_dir / json_file.name
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(replaced_data, f, ensure_ascii=False, indent=2)
            
            print(f"  → {count}個の値を置換しました")
            print(f"  → 保存先: {output_file.name}")
            
        except json.JSONDecodeError as e:
            print(f"  エラー: JSONの解析に失敗しました - {e}")
        except Exception as e:
            print(f"  エラー: {e}")
    
    print(f"\n完了: 合計{total_replaced}個の値を置換しました")
    print(f"すべてのファイルを {output_dir} に保存しました")
    
    return existing_files

def get_service_type(json_filename: str) -> str:
    """JSONファイル名からサービスタイプを判定"""
    # load.json と front.json は App Service、それ以外は Azure Functions
    if json_filename.lower() in ['load.json', 'front.json']:
        return 'webapp'
    return 'functionapp'

def load_deploy_config(config_file: Path) -> dict:
    """デプロイ設定.txtからデプロイ設定を読み込む"""
    if not config_file.exists():
        raise FileNotFoundError(f"設定ファイルが見つかりません: {config_file}")
    
    config = {
        'resource_group': None,
        'apps': {}  # {json_filename: app_name}
    }
    
    with open(config_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            if '：' in line:
                parts = line.split('：', 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    value = parts[1].strip()
                    
                    if key == 'リソースグループ':
                        config['resource_group'] = value
                    elif key.endswith('.json'):
                        # JSONファイル名とアプリ名を保存
                        config['apps'][key] = value
    
    return config

def delete_existing_appsettings(resource_group: str, app_name: str, service_type: str, az_cmd: str) -> bool:
    """既存の環境変数を全て削除する"""
    print(f"\n  既存の環境変数を削除しています...")
    
    # 現在の環境変数一覧を取得
    if service_type == "functionapp":
        list_cmd = [
            az_cmd, "functionapp", "config", "appsettings", "list",
            "--resource-group", resource_group,
            "--name", app_name,
        ]
    else:  # webapp
        list_cmd = [
            az_cmd, "webapp", "config", "appsettings", "list",
            "--resource-group", resource_group,
            "--name", app_name,
        ]
    
    try:
        result = subprocess.run(list_cmd, check=True, capture_output=True, text=True)
        current_settings = json.loads(result.stdout)
        
        if not current_settings:
            print(f"  → 削除する環境変数がありません")
            return True
        
        # システム環境変数、APPLICATIONINSIGHTS_CONNECTION_STRING、MICROSOFT_PROVIDER_AUTHENTICATION_SECRETのみ除外
        # AzureWebJobsStorage等は削除対象に含める（キー認証からマネージドID認証への移行のため）
        settings_to_delete = [
            setting['name'] for setting in current_settings
            if not setting['name'].startswith('WEBSITE_') and
               not setting['name'].startswith('FUNCTIONS_') and
               setting['name'] != 'APPLICATIONINSIGHTS_CONNECTION_STRING' and
               setting['name'] != 'MICROSOFT_PROVIDER_AUTHENTICATION_SECRET'
        ]
        
        if not settings_to_delete:
            print(f"  → 削除する環境変数がありません（システム環境変数のみ）")
            return True
        
        print(f"  → {len(settings_to_delete)}個の環境変数を削除します")
        
        # 環境変数を1つずつ削除
        for setting_name in settings_to_delete:
            if service_type == "functionapp":
                delete_cmd = [
                    az_cmd, "functionapp", "config", "appsettings", "delete",
                    "--resource-group", resource_group,
                    "--name", app_name,
                    "--setting-names", setting_name,
                ]
            else:  # webapp
                delete_cmd = [
                    az_cmd, "webapp", "config", "appsettings", "delete",
                    "--resource-group", resource_group,
                    "--name", app_name,
                    "--setting-names", setting_name,
                ]
            
            subprocess.run(delete_cmd, check=True, capture_output=True, text=True)
        
        print(f"  ✓ 環境変数の削除が完了しました")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"  ✗ エラー: 環境変数の削除に失敗しました")
        print(f"  {e.stderr}")
        return False
    except json.JSONDecodeError as e:
        print(f"  ✗ エラー: 環境変数の解析に失敗しました")
        print(f"  {e}")
        return False


def deploy_to_azure(output_dir: Path, json_files: list, deploy_config: dict, delete_before_deploy: bool = False):
    """生成されたJSONファイルをAzureにデプロイ
    
    Args:
        output_dir: 出力ディレクトリ
        json_files: デプロイするJSONファイルのリスト
        deploy_config: デプロイ設定
        delete_before_deploy: デプロイ前に既存の環境変数を削除するかどうか
    """
    resource_group = deploy_config['resource_group']
    
    if not resource_group:
        print("エラー: リソースグループが設定されていません")
        return
    
    # Azure CLIコマンド名を取得
    az_cmd = get_az_command()
    
    print(f"\n{'=' * 50}")
    print(f"Azureへのデプロイを開始します")
    print(f"リソースグループ: {resource_group}")
    if delete_before_deploy:
        print(f"モード: 既存の環境変数を削除してから再設定")
    else:
        print(f"モード: 既存の環境変数に追加/更新")
    print(f"{'=' * 50}\n")
    
    deployed_count = 0
    
    for json_file in json_files:
        output_file = output_dir / json_file.name
        
        if not output_file.exists():
            print(f"警告: {output_file.name} が見つかりません。スキップします。")
            continue
        
        # 設定ファイルからアプリ名を取得
        app_name = deploy_config['apps'].get(json_file.name)
        if not app_name:
            print(f"警告: {json_file.name} の設定が見つかりません。スキップします。")
            continue
        
        service_type = get_service_type(json_file.name)
        
        print(f"デプロイ中: {output_file.name}")
        print(f"  アプリ名: {app_name}")
        print(f"  サービスタイプ: {service_type}")
        
        # 既存の環境変数を削除（オプション）
        if delete_before_deploy:
            if not delete_existing_appsettings(resource_group, app_name, service_type, az_cmd):
                print(f"  警告: 環境変数の削除に失敗しましたが、デプロイを続行します\n")
        
        # Azure CLIコマンドを構築
        if service_type == "functionapp":
            cmd = [
                az_cmd, "functionapp", "config", "appsettings", "set",
                "--resource-group", resource_group,
                "--name", app_name,
                "--settings", f"@{str(output_file)}",
            ]
        else:  # webapp (App Service)
            cmd = [
                az_cmd, "webapp", "config", "appsettings", "set",
                "--resource-group", resource_group,
                "--name", app_name,
                "--settings", f"@{str(output_file)}",
            ]
        
        try:
            print(f"  >> {' '.join(cmd)}")
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(f"  ✓ デプロイ成功\n")
            deployed_count += 1
        except subprocess.CalledProcessError as e:
            print(f"  ✗ エラー: デプロイに失敗しました")
            print(f"  {e.stderr}\n")
        except FileNotFoundError:
            print(f"  ✗ エラー: Azure CLI (az) が見つかりません。インストールされているか確認してください。")
            print(f"  環境: {platform.system()}")
            print(f"  コマンド: {az_cmd}")
            return
    
    print(f"\n{'=' * 50}")
    print(f"デプロイ完了: {deployed_count}/{len(json_files)} 件成功")
    print(f"{'=' * 50}")



def main():
    # スクリプトが配置されているディレクトリを基準にする
    base_dir = Path(__file__).parent
    
    template_file = base_dir / 'テンプレート設定.txt'
    input_file = base_dir / '環境変数入力.txt'
    json_dir = base_dir / 'json'
    deploy_config_file = base_dir / 'デプロイ設定.txt'
    
    if not input_file.exists():
        print(f"エラー: {input_file} が存在しません")
        print("環境変数入力.txtファイルを作成してください")
        return
    
    if not json_dir.exists():
        print(f"エラー: {json_dir} が存在しません")
        return
    
    # デプロイパターンの定義
    deploy_patterns = {
        '1': {
            'name': 'ロードバランサー',
            'files': ['load']
        },
        '2': {
            'name': 'フロントエンド',
            'files': ['front']
        },
        '3': {
            'name': 'その他',
            'files': ['agent-doc', 'agent-rag', 'chat', 'indexer', 'mark', 'mark2', 
                     'mfg', 'page', 'page2', 'pdf', 'pii', 'prompt', 'rag', 'text']
        }
    }
    
    # 出力先フォルダ名をユーザーに入力してもらう
    print("=" * 50)
    output_folder_name = input("出力先のフォルダ名を入力してください: ").strip()
    
    if not output_folder_name:
        print("エラー: フォルダ名が入力されていません")
        return
    
    output_dir = base_dir / output_folder_name
    
    # どのパターンを処理するか選択
    print("\n" + "=" * 50)
    print("デプロイパターンを選択してください:")
    print("1: ロードバランサー (load.json)")
    print("2: フロントエンド (front.json)")
    print("3: その他 (agent-doc, agent-rag, chat, indexer, mark, mark2, mfg, page, page2, pdf, pii, prompt, rag, text)")
    print("=" * 50)
    
    pattern_choice = input("選択 (1/2/3): ").strip()
    
    if pattern_choice not in deploy_patterns:
        print("エラー: 無効な選択です")
        return
    
    selected_pattern = deploy_patterns[pattern_choice]
    print(f"\n選択されたパターン: {selected_pattern['name']}")
    print("=" * 50)
    
    print("\nテンプレート値を読み込み中...")
    template_values = load_template_values(template_file)
    print(f"{len(template_values)}個のテンプレート値を読み込みました")
    
    print("\n実際の値を読み込み中...")
    actual_values = load_mapping(input_file)
    print(f"{len(actual_values)}個の実際の値を読み込みました")
    
    print("\n置換マップを作成中...")
    replacement_map = create_replacement_map(template_values, actual_values)
    print(f"{len(replacement_map)}個の置換ルールを作成しました")
    
    if len(replacement_map) == 0:
        print("\n警告: 置換する値がありません。環境変数入力.txtに実際の値を記入してください")
        return
    
    # JSONファイルを生成
    generated_files = process_json_files(json_dir, replacement_map, output_dir, selected_pattern['files'])
    
    if not generated_files:
        print("\nエラー: JSONファイルの生成に失敗しました")
        return
    
    # Azureデプロイの選択
    print(f"\n{'=' * 50}")
    print("次の操作を選択してください:")
    print("1: JSONファイルの生成のみ（デプロイなし）")
    print("2: JSONファイルの生成 + Azureへデプロイ（既存の環境変数を削除してから再設定）")
    print(f"{'=' * 50}")
    
    deploy_choice = input("選択 (1/2): ").strip()
    
    if deploy_choice == '2':
        # デプロイ設定ファイルを読み込み
        if not deploy_config_file.exists():
            print(f"\nエラー: デプロイ設定ファイルが見つかりません: {deploy_config_file}")
            print("デプロイ設定.txt を作成してください。")
            return
        
        try:
            deploy_config = load_deploy_config(deploy_config_file)
            
            # Azureへデプロイ（常に既存の環境変数を削除してから再設定）
            deploy_to_azure(
                output_dir=output_dir,
                json_files=generated_files,
                deploy_config=deploy_config,
                delete_before_deploy=True
            )
        except Exception as e:
            print(f"\nエラー: デプロイ設定の読み込みに失敗しました: {e}")
            return
    else:
        print("\nJSONファイルの生成が完了しました。デプロイはスキップされました。")

if __name__ == '__main__':
    main()
