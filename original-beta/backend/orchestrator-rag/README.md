# Azure Functions RAGチャットシステム

## 概要
このプロジェクトは、Azure Functionsを基盤とした高度なRAG（Retrieval Augmented Generation）チャットシステムです。Azure OpenAI、Azure AI Search、Azure Cosmos DBを統合し、社内文書検索と自然言語による質問応答を実現します。

## 目次
- [機能](#機能)
- [アーキテクチャ](#アーキテクチャ)
- [前提条件](#前提条件)
- [セットアップ](#セットアップ)
- [使用方法](#使用方法)
- [プロジェクト構造](#プロジェクト構造)
- [環境変数](#環境変数)
- [エラーハンドリング](#エラーハンドリング)

## 機能
- **RAGチャット機能**
  - セマンティックハイブリッド検索
  - キーワード検索
  - 文脈を考慮した応答生成
- **ファイル処理**
  - PDF, DOCX, XLSX, PPTX, CSV, TXTファイル対応
  - マルチエンコーディング対応
- **辞書機能**
  - 表記揺れ補正
  - 用語の統一
  - 説明文の自動付与
- **エラーハンドリング**
  - 構造化されたエラーレスポンス
  - 詳細なログ記録

## アーキテクチャ
システムは以下のAzureサービスを統合しています：
- Azure Functions (アプリケーションホスティング)
- Azure OpenAI (言語モデル)
- Azure AI Search (文書検索)
- Azure Cosmos DB (辞書データ管理)

## 前提条件
- Python 3.x
- Azure サブスクリプション
- 必要なAzureサービスのセットアップ

## セットアップ
1. 依存パッケージのインストール
```bash
pip install -r requirements.txt

# dev lib
pip install -r requirements-dev.txt
```

# install azure function
# windows
[Windows 64-bit](https://go.microsoft.com/fwlink/?linkid=2174087) (VS Code debugging requires 64-bit)
```bash
#npm
npm i -g azure-functions-core-tools@4 --unsafe-perm true
# or
brew tap azure/functions
brew install azure-functions-core-tools@4
```

2. 環境変数の設定
必要な環境変数を`local.host.settings`ファイルに設定してください（[環境変数](#環境変数)セクション参照）

## 使用方法
### Azure function 起動方法
```bash
# ローカル開発環境での起動
func start

# 特定のポートを指定して起動
func start --port 7071

# デバッグモードで起動
func start --debug
```

### RAGチャットエンドポイント
```
POST /api/rag-chat
Content-Type: application/json
{
"question": "質問文",
"model": "gpt-5-pro",
"searchMethod": "semantic-hybrid-search",
"chatHistory": [],
"fileContent": null,
"fileExtension": null,
"fileName": null
}
```

### ファイル取得エンドポイント
```python
POST /api/get-file
Content-Type: application/json
{
"title": "ファイルタイトル",
"filepath": "ファイルパス"
}
```

## プロジェクト構造
.
├── function_app.py          # Azure Functionsのメインエントリーポイント
├── modules/
│   ├── rag.py              # RAG機能の実装（検索・生成処理）
│   │                       # - completion_rag_with_ref: メイン処理
│   │                       # - semantic_hybrid_search: ベクトル検索
│   │                       # - keyword_search: キーワード検索
│   ├── file.py             # ファイル処理の基本機能
│   │                       # - get_content_data: ファイル内容の取得と変換
│   ├── file_prompt.py      # 各種ファイル形式からのテキスト抽出
│   │                       # - get_file_content: PDF/DOCX/XLSX等の解析
│   ├── dictionary_methods.py # 辞書機能と表記揺れ処理
│   │                       # - dictionary_registration: 辞書登録
│   │                       # - inconsistency_collector_robust: 表記揺れ補正
│   ├── error_handler.py    # エラー処理とログ記録
│   │                       # - ErrorHandler: エラー種別の判定と処理
│   └── logging/            # ログ関連の定数と設定
│       └── constants.py    # ログタグとグループの定義
├── tests/                  # ユニットテストとモックテスト
└── requirements.txt        # 本番環境の依存パッケージ

## 環境変数

```.env
Azure OpenAI設定
LOAD_BALANCER_ENDPOINT=
AZURE_OPENAI_KEY=
AZURE_OPENAI_VERSION=
MODEL_IDENTIFIER=
TOP_P=
MAX_TOKENS=
Azure AI Search設定
AZURE_AISEARCH_ENDPOINT=
AZURE_AISEARCH_INDEX=
AZURE_AISEARCH_KEY=
Azure Cosmos DB設定
AZURE_COSMOSDB_URI=
AZURE_COSMOSDB_KEY=
AZURE_COSMOSDB_DATABASE_NAME=
AZURE_COSMOSDB_DICTIONARY_CONTAINER_NAME=
システムメッセージ
RAG_SYSTEM_MESSAGE_REF=
RAG_SYSTEM_MESSAGE_DEC=
```

## エラーハンドリング
システムは以下のエラーを適切に処理します：
- API制限エラー (429)
- 不正なリクエスト (400)
- コンテンツフィルターエラー
- サービス利用不可エラー (503)
- 内部エラー (500)

## モジュール説明

### RAG (Retrieval Augmented Generation) モジュール
**ファイル**: `modules/rag.py`

RAGの中核機能を提供するモジュールです。

主要コンポーネント:
- `completion_rag_with_ref()`: RAGのメイン処理
  - 検索と回答生成を統合
  - 引用情報の紐付け
  - 処理時間の計測

検索機能:
- `semantic_hybrid_search()`: セマンティック検索
  - Azure OpenAI Embeddingsを使用
  - ベクトル検索とキーワード検索のハイブリッド
- `keyword_search()`: キーワードベースの検索
  - Azure AI Searchによる全文検索

### ファイル処理モジュール
**ファイル**: `modules/file.py`, `modules/file_prompt.py`

各種ファイル形式の処理と内容抽出を行います。

`file.py`:
- `get_content_data()`: ファイルの基本処理
  - エンコーディング自動判定 (chardet使用)
  - CSV/TXTファイルのマルチエンコーディング対応
  - バイナリファイルのBase64エンコード

`file_prompt.py`:
- `get_file_content()`: 各種ファイル形式からのテキスト抽出
  - PDF: PyMuPDFによるテキスト抽出
  - DOCX: python-docxによる段落抽出
  - XLSX: openpyxlによるセル内容抽出
  - PPTX: python-pptxによるスライド内容抽出
  - CSV: csvモジュールによる構造化データ処理

### 辞書処理モジュール
**ファイル**: `modules/dictionary_methods.py`

表記揺れ補正と用語統一を行います。

主要機能:
- `dictionary_registration()`: 辞書登録のメイン処理
  - CosmosDBからの辞書データ読み込み
  - 処理時間の計測
- `inconsistency_collector_robust()`: 表記揺れ補正
  - ひらがな/カタカナ/漢字の揺れ吸収
  - 編集距離による類似度計算
  - 説明文の自動付与
- `jp2roma()`: 日本語のローマ字変換
  - MeCabによる読み取得
  - 表記揺れ検出の正規化

### エラーハンドリングモジュール
**ファイル**: `modules/error_handler.py`

構造化されたエラー処理とログ記録を提供します。

主要コンポーネント:
- `ErrorHandler`: エラー処理の中核クラス
  - エラー種別の判定
  - エラーメッセージのマッピング
  - ステータスコードの管理
- エラー種別:
  - OpenAI API関連エラー
  - レート制限エラー
  - リクエスト検証エラー
  - コンテンツフィルターエラー

### ログ管理モジュール
**ファイル**: `modules/logging/constants.py`

ログタグとグループを定義し、構造化されたログ記録を実現します。

主要コンポーネント:
- `LogTag`: ログタグのEnum定義
  - チャット、生成、検索など機能別タグ
- `TAG_GROUPS`: タグのグループ化
  - 関連する機能のタグをまとめて管理
  - ログフィルタリングの基準を提供


