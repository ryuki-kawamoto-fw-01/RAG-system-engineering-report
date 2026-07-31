# Playwright E2Eテスト実行ガイド

## 📋 概要

このディレクトリには、アプリケーションの各機能に対するE2Eテストが含まれています。
Playwrightを使用してブラウザを自動操作し、Azure Entra ID認証を含むフロー全体をテストします。

## 🔧 環境構築

### 前提条件

- Python 3.8以上
- pip（Pythonパッケージマネージャー）

### 1. インストール手順

#### ステップ1: Pythonのバージョン確認

```bash
python3 --version
# または
python --version
```

Python 3.8以上がインストールされていることを確認してください。

#### ステップ2: 必要なパッケージのインストール

プロジェクトルートディレクトリで、依存パッケージをインストールします：

```bash
# Playwrightとpytestをインストール
pip install playwright pytest

# または requirements.txt がある場合
cd frontend/tests/E2E
pip install -r requirements.txt
```

#### ステップ3: Playwrightブラウザのインストール

Playwrightが使用するブラウザバイナリをインストールします：

```bash
# Chromiumブラウザをインストール（推奨）
playwright install chromium

# すべてのブラウザをインストールする場合
playwright install

# システム依存パッケージも含めてインストール（Linux環境）
playwright install --with-deps chromium
```

**Linuxサーバー環境の場合（追加設定が必要な場合があります）:**

```bash
# 必要なシステムライブラリをインストール
sudo apt-get update
sudo apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2
```

### 2. プロキシ設定（企業環境の場合）

企業ネットワーク内でプロキシを使用している場合、`util/config.py`を編集します：

```python
# util/config.py

PROXY_CONFIG = {
    "server": "http://your-proxy-server:port",  # プロキシサーバーのURL
}

# プロキシが不要な場合
# PROXY_CONFIG = None
```

### 3. 環境変数の設定（オプション）

認証情報を環境変数で管理する場合：

```bash
# 手動認証モード（推奨）
export MANUAL_AUTH=true

# 自動認証モード（MFA無効の場合のみ）
export AZURE_AUTH_EMAIL="your-email@example.com"
export AZURE_AUTH_PASSWORD="your-password"

# ヘッドレスモード制御
export HEADLESS=false  # ブラウザを表示する場合
```

### 4. 動作確認

インストールが正しく完了したか確認します：

```bash
# Playwrightのバージョン確認
playwright --version

# pytestのバージョン確認
pytest --version

# 簡単なテストを実行（collect-onlyオプションでテスト関数の検出のみ）
cd /path/to/original-beta
pytest frontend/tests/E2E/features/source/chat.py::test_chat_features --collect-only
```

正常に動作すれば、以下のような出力が表示されます：

```
collected 1 item

<Package tests>
  <Package features>
    <Package source>
      <Module chat.py>
        <Function test_chat_features>

========================== 1 test collected in 0.03s ===========================
```

## 🚀 テスト実施コマンド

### 基本形式

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/<テストファイル名>.py::test_<関数名> -v -s
```

### 各機能のテストコマンド

#### チャット機能（16ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/chat.py::test_chat_features -v -s
```

- プロンプト送信、ファイル添付、テンプレート適用、フィードバック、履歴管理など

#### 文書検索機能（26ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/rag.py::test_rag_features -v -s
```

- 全フォルダ検索、フォルダ絞り込み、ファイル添付、各種ファイル形式プレビュー、設定変更など

**注意:** `source/rag.py`内の`FOLDER_NAME_TO_SEARCH`変数（デフォルト: "検証用"）を環境に合わせて変更してください。

#### アイデア作成（11ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-idea.py::test_create_idea_form_submission -v -s
```

- 件数変更、情報入力、結果調整、フィードバック、編集、コピー、ダウンロードなど

#### 議事録作成（12ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-minutes.py::test_create_minutes_functionality -v -s
```

- ファイル選択、ドラッグ&ドロップ、議事録作成、結果調整、フィードバックなど

#### メール作成（9ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-mail.py::test_create_mail_functionality -v -s
```

- 新規メール作成、結果調整、フィードバック、編集、mailtoリンクなど

#### 返信メール作成（10ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/reply-mail.py::test_reply_mail_functionality -v -s
```

- ファイルアップロード、返信メール作成、結果調整、フィードバックなど

#### 企業分析（11ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/company-analysis.py::test_company_analysis_functionality -v -s
```

- チェックボックス、情報入力、結果調整、フィードバック、編集など

#### 企業調査（10ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/corporate-survey.py::test_corporate_survey_functionality -v -s
```

- チェックボックス、情報入力、調査実行、フィードバック、編集など

#### 要約（11ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/summary.py::test_summary_functionality -v -s
```

- 要約モード変更、文字数指定、要約実行、フィードバック、編集など

#### 翻訳（10ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/translation.py::test_translation_functionality -v -s
```

- 言語選択、翻訳実行、フィードバック、編集、コピー、ダウンロードなど

#### 文章校正（12ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/text-correction.py::test_text_correction_functionality -v -s
```

- ファイルアップロード、文章の目的選択、チェックボックス、校正実行など

#### 想定質問（13ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/supposed-question.py::test_supposed_question_functionality -v -s
```

- ファイルアップロード、スライダー変更、質問作成、結果調整など

#### トークスクリプト（13ステップ）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/talk-script.py::test_talk_script_functionality -v -s
```

- ファイルアップロード、スライダー変更、スクリプト作成、結果調整など

## 🏢 本番環境・本番同等環境でのテスト実行（Windows PowerShell）

本番環境（stg環境）やプライベートエンドポイントが設定された環境でテストを実行する場合は、以下の手順に従ってください。
WSLの環境ではなく、Windowsの環境から打鍵を実施します。
WindowsのPowerShellからコマンドを実行します。

### 前提条件

- Windows 10/11
- VPN接続済み（プライベートエンドポイント環境の場合）
- Python 3.8以降がインストール済み

### セットアップ手順

#### 1. Python環境の確認（Windows側）（初回のみ）

```powershell
# PowerShellを開く
# Pythonがインストールされているか確認
python --version

# インストールされていない場合
# https://www.python.org/downloads/ からインストール
```

#### 2. 依存パッケージのインストール（初回のみ）

```powershell
# プロジェクトフォルダに移動（WSLのファイルシステム経由）
cd \\wsl$\Ubuntu\home\<ユーザー名>\original-beta

# または、Windowsにクローンしたリポジトリの場合
cd C:\path\to\original-beta

# プロキシ環境変数を設定
$env:HTTP_PROXY="http://umproxy.prx.intra.hitachi.co.jp:8080"
$env:HTTPS_PROXY="http://umproxy.prx.intra.hitachi.co.jp:8080"

# 依存パッケージをインストール
pip install -r frontend\tests\E2E\requirements.txt

# Playwrightブラウザをインストール
playwright install chromium
```

#### 3. config.pyの設定変更（毎回必要）

`frontend/tests/E2E/features/util/config.py` を編集する：

```python
# プロキシ設定を無効化（Windowsからテストする場合）
PROXY_CONFIG = None  # VPN経由で直接アクセス

# 本番同等環境などのURLを設定
BASE_URL = "｛プライベートエンドポイントのURL｝"
```

**重要：** プライベートエンドポイント環境では `PROXY_CONFIG = None` に設定してください。VPN接続経由で直接アクセスします。

#### 4. テスト実行（毎回必要）

```powershell
# プロジェクトフォルダに移動（WSLのファイルシステム経由）
cd \\wsl$\Ubuntu\home\<ユーザー名>\original-beta
# 手動認証モードでテスト実行
$env:MANUAL_AUTH="true"
# 翻訳画面の例
pytest frontend\tests\E2E\features\source\translation.py::test_translation_functionality -v -s
```

### 環境別の設定例

#### WSL（開発環境）での実行

```python
# config.py
PROXY_CONFIG = {
    "server": "http://umproxy.prx.intra.hitachi.co.jp:8080",
}
BASE_URL = "https://frontend-hr-ateam-14-fqahaudqdydsc3dn.japaneast-01.azurewebsites.net"
```

```bash
# WSLで実行
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-mail.py -v -s
```

#### Windows PowerShell（本番同等環境）での実行

```python
# config.py
PROXY_CONFIG = None  # プロキシなし（VPN経由）
BASE_URL = "https://frontend-genashi-test-01-stg.azurewebsites.net/"
```

```powershell
# Windows PowerShellで実行
$env:MANUAL_AUTH="true"
# 翻訳画面の例
pytest frontend\tests\E2E\features\source\translation.py::test_translation_functionality -v -s
```

### トラブルシューティング（Windows環境）

#### Playwrightブラウザのダウンロードが失敗する

```powershell
# プロキシ環境変数を設定してからインストール
$env:HTTP_PROXY="http://umproxy.prx.intra.hitachi.co.jp:8080"
$env:HTTPS_PROXY="http://umproxy.prx.intra.hitachi.co.jp:8080"
playwright install chromium
```

#### ERR_CONNECTION_RESET エラーが出る

- VPN接続を確認
- `PROXY_CONFIG = None` になっているか確認
- Azureポータルでアプリケーションが起動中か確認

#### 認証は成功するが、Application errorが表示される

- ブラウザでF12キーを押して開発者ツールのコンソールを確認
- `BASE_URL` が正しいか確認（末尾のスラッシュを含む）
- Azure App Serviceの環境変数が正しく設定されているか確認

## 🔐 認証状態の保存と再利用

### 初回実行（MFA認証が必要）

```bash
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-mail.py -v -s
```

ブラウザが開き、手動でMFA認証を行います。認証完了後、認証状態が自動的に `frontend/tests/E2E/features/temp/auth_state.json` に保存されます。

### 2回目以降の実行（MFA認証不要）

```bash
# 同じコマンドでOK - 認証状態が自動的に再利用されます
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-mail.py -v -s
```

保存された認証状態を使用するため、MFA認証画面は表示されず、即座にテストが開始されます。

### 認証状態の管理

```bash
cd frontend/tests/E2E/features/util

# 認証状態を確認
python manage_auth.py check

# 認証状態を削除（再認証が必要になります）
python manage_auth.py clear
```

## 📝 オプション説明

| オプション                 | 説明                                                                       |
| -------------------------- | -------------------------------------------------------------------------- |
| `-v` または `--verbose`    | テストの詳細情報を表示                                                     |
| `-s` または `--capture=no` | **print文を表示（必須！）** このオプションがないと詳細ログが表示されません |
| `MANUAL_AUTH=true`         | 手動認証モードを有効化（ブラウザが表示され、認証後に自動続行）             |

### トラブルシューティング

#### エラー: `playwright: command not found`

```bash
# pipのインストールパスを確認
python3 -m pip show playwright

# パスが通っていない場合、以下を~/.bashrcまたは~/.zshrcに追加
export PATH="$HOME/.local/bin:$PATH"
source ~/.bashrc  # または source ~/.zshrc
```

#### エラー: `Browser is not installed`

```bash
# ブラウザを再インストール
playwright install chromium --with-deps
```

#### エラー: プロキシ接続エラー

```bash
# プロキシ環境変数を設定
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port

# Playwrightブラウザをインストール
playwright install chromium
```

### ディレクトリ構成

```
frontend/tests/E2E/features/
├── README.md                   # このファイル
│
├── util/                       # 共通ユーティリティモジュール
│   ├── __init__.py
│   ├── auth_helper.py         # Azure Entra ID認証関連の共通処理
│   ├── test_helper.py         # テスト共通機能（スクショ、エビデンス管理等）
│   ├── config.py              # 共通設定（プロキシ、URL等）
│   └── manage_auth.py         # 認証状態管理ツール
│
├── source/                     # テストソースファイル
│   ├── __init__.py
│   ├── chat.py                # チャット機能のE2Eテスト（16ステップ）
│   ├── rag.py                 # 文書検索画面のE2Eテスト（26ステップ）
│   ├── create-idea.py         # アイデア作成フォームのE2Eテスト（11ステップ）
│   ├── create-minutes.py      # 議事録作成画面のE2Eテスト（12ステップ）
│   ├── create-mail.py         # メール作成画面のE2Eテスト（9ステップ）
│   ├── reply-mail.py          # 返信メール作成画面のE2Eテスト（10ステップ）
│   ├── company-analysis.py    # 企業分析画面のE2Eテスト（11ステップ）
│   ├── corporate-survey.py    # 企業調査画面のE2Eテスト（10ステップ）
│   ├── summary.py             # 要約画面のE2Eテスト（11ステップ）
│   ├── translation.py         # 翻訳機能のE2Eテスト（10ステップ）
│   ├── text-correction.py     # 文章校正画面のE2Eテスト（12ステップ）
│   ├── supposed-question.py   # 想定質問画面のE2Eテスト（13ステップ）
│   └── talk-script.py         # トークスクリプト画面のE2Eテスト（13ステップ）
│
├── temp/                       # テスト用ファイル保存先
│   ├── 【標準提案書】製造業向けアシスタントAI.pptx
│   ├── test.msg               # テスト用メールファイル
│   └── auth_state.json        # 認証状態（自動生成、.gitignore対象）
│
└── evidence/                   # エビデンス保存先（自動生成）
    └── test_YYYYMMDD_HHMMSS/  # タイムスタンプ付きフォルダ
        ├── *.png              # スクリーンショット
        └── test_execution.log # テスト実行ログ
```

## ⚙️ 設定ファイル (util/config.py)

全テストで共通的に使用する設定を管理しています。環境に応じて値を変更してください。

**主な設定項目:**

```python
# プロキシ設定（プロキシが不要な環境では None に設定）
PROXY_CONFIG = {
    "server": "プロキシURL",
}

# フロントエンドのデプロイURL（テスト環境）
BASE_URL = "打鍵環境のURL"

# 例
# BASE_URL = "https://frontend-hr-ateam-14-fqahaudqdydsc3dn.japaneast-01.azurewebsites.net"

# スクリーンショット設定
SCREENSHOT_FULL_PAGE = True  # ページ全体をキャプチャ（スクロール領域含む）

# ブラウザ起動オプション
BROWSER_ARGS = [
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
]
```

**環境を変更する場合:**

- `PROXY_CONFIG`: プロキシサーバーのURLを変更、またはプロキシ不要な場合は `None` に設定
- `BASE_URL`: テスト対象のデプロイURLを変更（テスト環境 or 本番環境）
- `SCREENSHOT_FULL_PAGE`: 画面全体のキャプチャが不要な場合は `False` に設定

## 🛠️ 共通ヘルパーモジュール

新しいテストファイルを作成する際は、以下の共通モジュールを活用してください。

### util/auth_helper.py - 認証関連

Azure Entra ID認証に関連する処理を提供します。

#### 主要関数

| 関数名                                                | 説明                     | 戻り値              |
| ----------------------------------------------------- | ------------------------ | ------------------- |
| `handle_azure_authentication(page, manual_auth_mode)` | Azure Entra ID認証を処理 | `bool` (成功: True) |
| `handle_terms_agreement(page)`                        | 利用規約への同意を処理   | `bool` (成功: True) |
| `wait_for_manual_authentication(page, timeout)`       | 手動認証完了を待機       | `bool` (成功: True) |

**使用例:**

```python
# source/内のテストファイルから相対インポート
from ..util.auth_helper import handle_azure_authentication, handle_terms_agreement

# Azure Entra ID認証
if not handle_azure_authentication(page, manual_auth_mode):
    print("認証に失敗しました")
    return

# 利用規約への同意
if not handle_terms_agreement(page):
    print("利用規約同意処理に失敗しました")
    return
```

### util/test_helper.py - テスト共通機能

エビデンス管理、スクリーンショット保存などの共通機能を提供します。

#### 主要関数

| 関数名                                                   | 説明                               | 戻り値                   |
| -------------------------------------------------------- | ---------------------------------- | ------------------------ |
| `ensure_evidence_dir()`                                  | エビデンス保存用ディレクトリを作成 | `str` (ディレクトリパス) |
| `save_screenshot(page, test_dir, filename, description)` | スクリーンショットを保存           | `str` (ファイルパス)     |
| `print_test_summary(test_dir)`                           | テスト完了後のサマリーを表示       | なし                     |

**使用例:**

```python
# source/内のテストファイルから相対インポート
from ..util.test_helper import ensure_evidence_dir, save_screenshot, print_test_summary

# エビデンスディレクトリ作成
test_dir = ensure_evidence_dir()

# スクリーンショット保存
save_screenshot(page, test_dir, "01_screen.png", "画面表示確認")

# テスト完了サマリー表示
print_test_summary(test_dir)
```

## 🆕 新しいテストの作成

新しい画面のテストを作成する場合は、以下のテンプレートを使用してください。

**ファイルの配置**: `source/feature-name.py` （例: `source/create-idea.py`, `source/chat.py`, `source/rag.py`）

**ファイル名の命名規則**: `feature-name.py`

```python
"""
feature-name.py - 機能名のE2Eテスト

【テスト観点】
①...
②...
"""
import os
from playwright.sync_api import sync_playwright

# 共通ヘルパーモジュールをインポート（相対インポート）
from ..util.auth_helper import handle_azure_authentication, handle_terms_agreement
from ..util.test_helper import ensure_evidence_dir, save_screenshot, print_test_summary
from ..util.config import PROXY_CONFIG, BASE_URL, BROWSER_ARGS


def test_feature_name():
    """機能名のE2Eテスト"""

    test_dir = ensure_evidence_dir()

    with sync_playwright() as p:
        manual_auth_mode = os.getenv("MANUAL_AUTH", "false").lower() == "true"
        headless_mode = False if manual_auth_mode else True

        browser = p.chromium.launch(
            headless=headless_mode,
            proxy=PROXY_CONFIG,
            args=BROWSER_ARGS
        )

        context = browser.new_context()
        page = context.new_page()

        # トップページにアクセス
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")

        # Azure Entra ID認証
        if not handle_azure_authentication(page, manual_auth_mode):
            context.close()
            browser.close()
            return

        # 利用規約への同意
        if not handle_terms_agreement(page):
            context.close()
            browser.close()
            return

        # テストページに遷移
        page.goto(f"{BASE_URL}/your-page")
        page.wait_for_load_state("networkidle")

        try:
            # テストシナリオ
            save_screenshot(page, test_dir, "01_test.png", "テスト1")

            # ... テストロジック ...

        except Exception as e:
            print(f"テスト中にエラー: {e}")
            save_screenshot(page, test_dir, "ERROR.png", "エラー")
            raise
        finally:
            context.close()

        print_test_summary(test_dir)
        browser.close()


if __name__ == "__main__":
    test_feature_name()
```

**詳細なガイドライン:**

- [`.github/prompts/playwright活用.prompt.md`](/.github/prompts/playwright活用.prompt.md) - 包括的なルールブックとベストプラクティス

## 📸 エビデンス

テスト実行後、以下のディレクトリに各テスト観点の前後のスクリーンショットとログが自動保存されます：

```
frontend/tests/E2E/features/evidence/
  └── test_YYYYMMDD_HHMMSS/
```

### ダウンロード機能のエビデンスについて

**現在の実装:**

- ダウンロード前後のページ全体をスクリーンショット（`full_page=True`）
- ダウンロードされたファイル自体をエビデンスディレクトリに保存
- ダウンロードイベントの検知と詳細ログ出力

**技術的制限:**
Playwrightのスクリーンショット機能は、Webページのコンテンツのみをキャプチャします。
ブラウザのネイティブUI（ダウンロードポップアップなど）は含まれません。
ファイル添付機能はドラッグ＆ドロップには未対応です。
フォルダからのファイル添付機能のみの対応です。

**推奨アプローチ（現在の実装）:**

1. ダウンロードイベントが確実に検知されている（`page.expect_download()`）
2. ダウンロードされたファイルがエビデンスディレクトリに保存されている
3. ファイル名とファイルサイズがログに記録されている

これらのエビデンスにより、ダウンロード機能が正常に動作していることが証明できます。

### エビデンスの確認

```bash
# 保存されたエビデンスを確認
ls -la frontend/tests/E2E/features/evidence/

# 最新のテスト結果を開く
cd frontend/tests/E2E/features/evidence/test_*  # Tabキーで最新を補完
```

## 🔧 環境変数

テストの動作を制御する環境変数：

| 環境変数              | 説明                                                      | デフォルト値                         |
| --------------------- | --------------------------------------------------------- | ------------------------------------ |
| `MANUAL_AUTH`         | 手動認証モード（推奨）                                    | `false`                              |
| `AZURE_AUTH_EMAIL`    | 認証用メールアドレス                                      | `hiroki.sano.dx@hitachi-systems.com` |
| `AZURE_AUTH_PASSWORD` | 認証用パスワード（自動認証用、MFAがない場合のみ）         | （なし）                             |
| `HEADLESS`            | ヘッドレスモード（MANUAL_AUTH=trueの場合は自動的にfalse） | `true`                               |

### 使用例

```bash
# 手動認証モードで実行（推奨）
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/<テストファイル名>.py::test_<関数名> -v -s

# 例: チャット機能のテスト
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/chat.py::test_chat_features -v -s

# 例: アイデア作成画面のテスト
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-idea.py::test_create_idea_form_submission -v -s

# 自動認証（パスワード指定、MFAがない場合のみ）
AZURE_AUTH_PASSWORD="your_password" pytest frontend/tests/E2E/features/source/<テストファイル名>.py::test_<関数名> -v -s
```

## � CI/CD環境での実行

### Headlessモードで実行

```bash
# プロキシなし、ヘッドレスモード
HEADLESS=true pytest frontend/tests/E2E/features/source/ -v -s
```

### 認証状態の事前準備

CI/CD環境では、事前に認証状態を取得しておき、環境変数やシークレットとして保存することで、毎回の認証を回避できます。

```bash
# 1. ローカルで認証状態を取得
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-mail.py -v -s

# 2. 認証状態ファイルをCI/CDの環境変数に設定
# frontend/tests/E2E/features/temp/auth_state.json の内容をコピー

# 3. CI/CDで実行前に認証状態を復元
echo "$AUTH_STATE_JSON" > frontend/tests/E2E/features/temp/auth_state.json

# 4. テスト実行
pytest frontend/tests/E2E/features/source/ -v -s
```

## �📚 参考

### テストファイルと関数名の対応表

**注意**: すべてのテストファイルは `source/` ディレクトリ内にあります。

| テストファイル                | テスト関数名                           | ステップ数 |
| ----------------------------- | -------------------------------------- | ---------- |
| `source/chat.py`              | `test_chat_features`                   | 16         |
| `source/rag.py`               | `test_rag_features`                    | 26         |
| `source/create-idea.py`       | `test_create_idea_form_submission`     | 11         |
| `source/create-minutes.py`    | `test_create_minutes_functionality`    | 12         |
| `source/create-mail.py`       | `test_create_mail_functionality`       | 9          |
| `source/reply-mail.py`        | `test_reply_mail_functionality`        | 10         |
| `source/company-analysis.py`  | `test_company_analysis_functionality`  | 11         |
| `source/corporate-survey.py`  | `test_corporate_survey_functionality`  | 10         |
| `source/summary.py`           | `test_summary_functionality`           | 11         |
| `source/translation.py`       | `test_translation_functionality`       | 10         |
| `source/text-correction.py`   | `test_text_correction_functionality`   | 12         |
| `source/supposed-question.py` | `test_supposed_question_functionality` | 13         |
| `source/talk-script.py`       | `test_talk_script_functionality`       | 13         |

### リンク

- [Playwright公式ドキュメント](https://playwright.dev/python/)
- [pytest公式ドキュメント](https://docs.pytest.org/)

## 🔍 サポート

問題が発生した場合は、以下を確認してください：

1. **Playwrightとpytestが正しくインストールされているか**

   ```bash
   playwright --version
   pytest --version
   ```

2. **プロジェクトルートから実行しているか**

   ```bash
   cd /home/hiroki-sano-dx/original-beta
   pytest frontend/tests/E2E/features/source/create-mail.py -v -s
   ```

3. **プロキシ設定が正しいか**
   - WSL環境: `PROXY_CONFIG = {"server": "http://umproxy.prx.intra.hitachi.co.jp:8080"}`
   - Windows環境（VPN接続時）: `PROXY_CONFIG = None`

4. **認証状態ファイルが有効か（期限切れの場合は削除して再認証）**

   ```bash
   cd frontend/tests/E2E/features/util
   python manage_auth.py clear
   ```

5. **環境変数が正しく設定されているか（特に`BASE_URL`）**
   ```python
   # util/config.py
   BASE_URL = "https://your-frontend-url.azurewebsites.net"
   ```

---

**最終更新:** 2026年4月8日  
**場所:** `/home/hiroki-sano-dx/original-beta/frontend/tests/E2E/features/`  
**統合元:** `frontend/tests/E2E/README.md`
