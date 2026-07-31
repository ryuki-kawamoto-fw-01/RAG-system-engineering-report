# env_maker - Azure環境変数自動設定ツール

## 📖 このツールは何ができるの？

`env_maker`は、Azure App ServiceとAzure Functionsの環境変数設定を**自動化**するツールです。

### 主な機能
1. **環境変数JSONファイルの自動生成**
   - テンプレートのJSONファイルに、実際の環境の値（URL、キー、名前など）を自動で埋め込みます
   - 複数のJSONファイルを一括処理できます

2. **Azureへの自動デプロイ（オプション）**
   - 生成したJSONファイルをAzure App ServiceやAzure Functionsに直接デプロイできます
   - Azure CLIを使用して環境変数を一括設定します

### こんな時に便利！
- 新しい環境（開発環境、本番環境など）をセットアップする時
- 複数のAzure関数アプリに同じ設定値を反映したい時
- 手動で設定ファイルを編集・デプロイするのが面倒な時
- 環境変数の設定ミスを防ぎたい時

---

## 📁 ファイル構成

```
env_maker/
├── env_maker.py              # メインプログラム（唯一の実行ファイル）
├── 環境変数入力.txt          # ここに実際の値を入力します
├── テンプレート設定.txt      # テンプレート値の定義（編集不要）
├── デプロイ設定.txt          # Azureデプロイ先の設定
└── json/                    # テンプレートJSONファイル
    ├── front.json           # フロントエンド用（App Service）
    ├── load.json            # ロードバランサー用（App Service）
    ├── chat.json            # チャット機能用（Azure Functions）
    ├── rag.json             # RAG機能用（Azure Functions）
    └── ...                  # その他の機能用
```

---

## 🚀 使い方（4ステップ）

### ステップ1️⃣: 環境変数入力.txtに実際の値を記入する

[環境変数入力.txt](環境変数入力.txt) を開いて、`ここに実際の〜を入力` の部分に実際の値を書き込みます。

**記入例：**
```
クライアントシークレット：abc123xyz789

ロードバランサ―URL：https://my-load-balancer.azurewebsites.net/

chat関数アプリ名：func-my-chat-app
text関数アプリ名：func-my-text-app
```

**ポイント：**
- `：`（全角コロン）の後ろに値を入力してください
- わからない項目は `ここに実際の〜` のままでOK（その項目はスキップされます）
- 必要な項目だけ入力すれば大丈夫です

---

### ステップ2️⃣: デプロイ設定.txtを編集する（Azureデプロイする場合のみ）

Azureへ自動デプロイする場合は、[デプロイ設定.txt](デプロイ設定.txt) を編集します。

**設定例：**
```
リソースグループ：rg-production

load.json：myapp-load
front.json：myapp-frontend
chat.json：func-chat
rag.json：func-rag
```

**ポイント：**
- `load.json` と `front.json` は自動的にApp Serviceとして認識されます
- その他のJSONファイルはAzure Functionsとして認識されます
- JSONファイル生成のみの場合は、このステップをスキップできます

---

### ステップ3️⃣: プログラムを実行する

**Windows (PowerShell/コマンドプロンプト):**
```bash
cd C:\Users\[ユーザー名]\Documents\Python勉強用\env_maker
python env_maker.py
```

**Linux/Mac:**
```bash
cd /path/to/env_maker
python env_maker.py
```

**VS Codeのターミナルから:**
```bash
python env_maker.py
```

---

### ステップ4️⃣: 画面の指示に従って選択する

プログラムを実行すると、以下のような質問が表示されます：

#### 📂 出力先フォルダの指定
```
==================================================
出力先のフォルダ名を入力してください: 
```
👉 **出力先のフォルダ名を入力**（例：`production`、`dev-environment` など）

#### 🎯 デプロイパターンの選択
```
==================================================
デプロイパターンを選択してください:
1: ロードバランサー (load.json)
2: フロントエンド (front.json)
3: その他 (agent-doc, agent-rag, chat, indexer, mark, mark2, mfg, page, page2, pdf, pii, prompt, rag, text)
==================================================
選択 (1/2/3): 
```
👉 **処理したいパターンの番号を入力**（1、2、または3）

#### 🚀 デプロイ方法の選択
```
==================================================
次の操作を選択してください:
1: JSONファイルの生成のみ（デプロイなし）
2: JSONファイルの生成 + Azureへデプロイ
==================================================
選択 (1/2): 
```
👉 **実行したい操作を選択**
- **1を選択**: JSONファイルのみ生成（手動デプロイ用）
- **2を選択**: JSONファイル生成後、自動的にAzureへデプロイ

---

### 完成！

#### オプション1を選択した場合
指定したフォルダ内に、値が置き換わったJSONファイルが生成されます。

**例：**
```
env_maker/
└── production/          # 新しく作成されたフォルダ
    ├── front.json      # 実際の値が入ったファイル
    ├── chat.json
    └── ...
```

#### オプション2を選択した場合
JSONファイル生成後、Azure CLIを使用して自動的にデプロイされます。

**実行例：**
```
デプロイ中: chat.json
  アプリ名: func-chat
  サービスタイプ: functionapp
  >> az functionapp config appsettings set --resource-group rg-production --name func-chat --settings @chat.json
  ✓ デプロイ成功

デプロイ完了: 3/3 件成功
```

---

## 💡 よくある質問

### Q1: Azure CLIのインストールが必要ですか？
**A:** デプロイ機能を使用する場合のみ必要です。JSONファイルの生成だけなら不要です。

Azure CLIのインストール方法：
- **Windows**: https://learn.microsoft.com/ja-jp/cli/azure/install-azure-cli-windows
- **Linux/Mac**: https://learn.microsoft.com/ja-jp/cli/azure/install-azure-cli

インストール後、以下のコマンドでログインしてください：
```bash
az login
```

---

### Q2: デプロイ設定.txtの書き方がわからない
**A:** 以下の形式で記述してください：

```
# リソースグループ（必須）
リソースグループ：rg-your-resource-group

# 各JSONファイルのデプロイ先
<JSONファイル名>：<アプリ名>
```

**具体例：**
```
リソースグループ：rg-production

load.json：myapp-load
front.json：myapp-frontend
chat.json：func-chat
rag.json：func-rag
```

---

### Q3: 一部の値だけ置き換えたい
**A:** [環境変数入力.txt](環境変数入力.txt) で、置き換えたい項目だけ実際の値を入力してください。`ここに実際の〜` のままの項目は自動的にスキップされます。

---

### Q4: 生成されたファイルを確認したい
**A:** 指定した出力フォルダ内のJSONファイルを開いて、値が正しく置き換わっているか確認してください。

---

### Q5: 元のJSONファイルは上書きされる？
**A:** いいえ、元のファイルは変更されません。新しいフォルダに生成されます。

---

### Q6: デプロイに失敗した場合は？
**A:** 以下を確認してください：
1. Azure CLIがインストールされているか（`az --version` で確認）
2. Azureにログインしているか（`az login`）
3. デプロイ設定.txtのリソースグループ名とアプリ名が正しいか
4. 対象のリソースが存在するか

エラーメッセージを確認して、必要に応じて修正してください。

---

### Q7: App ServiceとAzure Functionsの違いは？
**A:** ツールが自動的に判定します：
- **App Service**: `load.json` と `front.json`
- **Azure Functions**: その他のすべてのJSONファイル

この判定は `get_service_type()` 関数で行われており、必要に応じてカスタマイズできます。

---

## 🔧 技術的な詳細

### 動作の仕組み
1. [テンプレート設定.txt](テンプレート設定.txt) から置き換え対象の**テンプレート値**を読み込み
2. [環境変数入力.txt](環境変数入力.txt) から**実際の値**を読み込み
3. テンプレートと実際の値のマッピングを作成
4. JSONファイル内の値を一括置換
5. 新しいフォルダに出力
6. （オプション）Azure CLIを使用してデプロイ

### サービスタイプの自動判定

ツールは、JSONファイル名からサービスタイプを自動判定します：

| JSONファイル | サービスタイプ | Azure CLIコマンド |
|-------------|--------------|------------------|
| load.json | App Service (webapp) | `az webapp config appsettings set` |
| front.json | App Service (webapp) | `az webapp config appsettings set` |
| その他 | Azure Functions (functionapp) | `az functionapp config appsettings set` |

### デプロイパターンの詳細

| パターン | 対象ファイル | 用途 |
|---------|------------|------|
| 1 | load.json | ロードバランサーの設定 |
| 2 | front.json | フロントエンドアプリケーションの設定 |
| 3 | agent-doc, agent-rag, chat, indexer, mark, mark2, mfg, page, page2, pdf, pii, prompt, rag, text | バックエンド機能の設定 |

### デプロイフロー

```
環境変数入力.txt → 値の読み込み
       ↓
テンプレート設定.txt → テンプレート値の読み込み
       ↓
JSONファイル生成 → 値の置換
       ↓
デプロイ選択 → 1: 生成のみ / 2: デプロイも実行
       ↓
（2を選択した場合）
デプロイ設定.txt → デプロイ先の読み込み
       ↓
Azure CLI → 環境変数の設定
       ↓
完了
```

---

## 📝 メンテナンス

### 新しい項目を追加する場合
1. [テンプレート設定.txt](テンプレート設定.txt) にテンプレート値を追加
2. [環境変数入力.txt](環境変数入力.txt) に対応する入力欄を追加
3. 必要に応じてJSONテンプレートファイルを更新

### 新しいAzureリソースを追加する場合
1. [デプロイ設定.txt](デプロイ設定.txt) に以下の形式で追加：
   ```
   <JSONファイル名>：<アプリ名>
   ```
2. load.jsonまたはfront.json以外は自動的にAzure Functionsとして認識されます

### サービスタイプの判定をカスタマイズする場合
[env_maker.py](env_maker.py) の `get_service_type()` 関数を編集：
```python
def get_service_type(json_filename: str) -> str:
    """JSONファイル名からサービスタイプを判定"""
    # load.json と front.json は App Service、それ以外は Azure Functions
    if json_filename.lower() in ['load.json', 'front.json', 'your-app.json']:  # ← ここに追加
        return 'webapp'
    return 'functionapp'
```

---

## ⚠️ 注意事項

- **機密情報の取り扱い**：
  - 生成されたJSONファイルには機密情報（キー、シークレットなど）が含まれます
  - `.gitignore`に出力フォルダを追加してください
  - 環境変数入力.txtもGitにコミットしないよう注意してください

- **Azure CLIの認証**：
  - デプロイ機能を使用する前に `az login` でAzureにログインしてください
  - 正しいサブスクリプションが選択されているか確認してください（`az account show`）

- **バックアップ**：
  - 重要な設定を扱う場合は、事前にバックアップを取ることをお勧めします
  - Azureポータルから現在の設定をエクスポートできます

- **検証**：
  - 生成されたファイルは、必ず内容を確認してから使用してください
  - デプロイ前にJSONファイルの内容を確認することをお勧めします

- **権限**：
  - Azureリソースへのデプロイには適切な権限が必要です
  - リソースグループとアプリケーションへの「共同作成者」以上の権限が必要です

---

## 🆘 困った時は

### エラーが発生した場合
1. **エラーメッセージを確認する**
   - 画面に表示されるエラーメッセージに解決のヒントがあります

2. **入力ファイルの形式を確認する**
   - [環境変数入力.txt](環境変数入力.txt) が `項目名：値` の形式になっているか
   - 全角コロン（：）が使用されているか

3. **Azure CLIの状態を確認する**（デプロイ時）
   ```bash
   # Azure CLIのバージョン確認
   az --version
   
   # ログイン状態の確認
   az account show
   
   # サブスクリプション一覧
   az account list --output table
   ```

4. **デプロイ設定を確認する**
   - リソースグループ名が正しいか
   - アプリ名が正しいか
   - 対象のリソースが存在するか

5. **それでも解決しない場合**
   - 開発チームに相談してください
   - エラーメッセージのスクリーンショットを共有してください

---

## 📌 まとめ

### 基本的な使い方（JSONファイル生成のみ）
1. **[環境変数入力.txt](環境変数入力.txt) に値を記入**
2. **`python env_maker.py` を実行**
3. **フォルダ名とパターンを選択**
4. **「1」を選択（生成のみ）**
5. **完成したJSONファイルを確認**

### Azure自動デプロイを使う場合
1. **[環境変数入力.txt](環境変数入力.txt) に値を記入**
2. **[デプロイ設定.txt](デプロイ設定.txt) にデプロイ先を設定**
3. **Azure CLIでログイン（`az login`）**
4. **`python env_maker.py` を実行**
5. **フォルダ名とパターンを選択**
6. **「2」を選択（生成 + デプロイ）**
7. **デプロイ完了を確認**

これで、面倒な設定ファイルの作成とデプロイが自動化されます！
