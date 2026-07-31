# Orchestrator Agent

## 概要
Orchestrator Agentは、Azure Functionsを基盤としたAI Agent Orchestrationシステムです。Azure Agent Service、Azure OpenAI、Azure AI Search、Azure Cosmos DBを統合し、高度な文書検索と自然言語による対話型タスク実行を実現します。

## 主な機能

- **RAG Agent**
  - セマンティック検索とキーワード検索を組み合わせたハイブリッド検索
  - 複数のLLMを使った計画・実行・振り返りのオーケストレーション
  - ユーザーの質問に対する最適なツール選択と活用

- **ドキュメント処理**
  - PDF、DOCX、XLSX、PPTX、CSV、TXTなど多様な文書形式対応
  - 企画書や仕様書に特化した表検索機能
  - マルチエンコーディング対応

- **語彙処理**
  - CosmosDBを活用した辞書機能
  - 表記揺れ補正と用語統一
  - 専門用語の説明文自動付与

- **エラー処理と監視**
  - 構造化されたエラーレスポンス
  - 詳細なログ記録とモニタリング

## システムアーキテクチャ

```
orchestrator-agent/
├── function_app.py     # Azure Functions エントリポイント
├── README.md           # このドキュメント
└── modules/
    ├── agent/          # コアエージェントツール群
    │   ├── tool.py     # 検索ツール実装
    │   ├── model.py    # データモデル
    │   └── prompt.py   # プロンプトテンプレート
    ├── specification/  # 規格書検索ツール群
    │   ├── tool.py     # 規格書検索ツールの実装
    │   ├── model.py    # データモデル
    │   └── prompt.py   # プロンプトテンプレート
    ├── text/           # テキスト処理ユーティリティ
    │   ├── dictionary_methods.py  # 辞書処理
    │   └── get_file_content.py    # ファイル抽出
    ├── logging/        # ログ機能
    ├── di_container.py # 依存性注入コンテナ
    ├── entity.py       # エンティティ定義
    ├── model.py        # データモデル
    ├── service.py      # サービス実装
    └── error_handler.py # エラーハンドリング
```

## 前提条件

- Python 3.11以上
- Azure サブスクリプション
- MeCabのインストール（辞書機能で使用）

## セットアップ

### 環境変数の設定

Devcontainer内で以下を実行。

環境変数は local.settings.json ファイルから読み取られます。VS Codeで設定するには：

1. VS Codeを開き、コマンドパレット（Ctrl + Shift + P または Cmd + Shift + P）を表示
2. `Azure Functions: Download Remote Settings` を選択
3. 適切なAzure Functionsリソースを選択すると、`local.settings.json` が自動的にダウンロードされます

## 使用方法

### ローカル開発環境での実行

```bash
# 標準実行
func start

# 特定のポートで実行
func start --port 7071

# デバッグモードで実行
func start --debug
```

### APIエンドポイント

#### 1. プランニング

ユーザーの質問を分析し、検索計画を生成します。

```
POST /planning
Content-Type: application/json

{
  "question": "鉄鋼材料の熱処理について教えてください",
  "model": "gpt-5.2",
  "chatHistory": [],
  "category": "technical",
  "task": "rag",
  "fileName": "document.pdf",
  "mediaType": "application/pdf"
}
```

#### 2. ツール使用

生成された計画に基づき、指定されたツールを実行します。

```
POST /tool-use
Content-Type: application/json

{
  "messages": [...],
  "tool_calls": [...],
  "category": "technical",
  "task": "rag"
}
```

#### 3. 振り返り

検索結果を分析し、追加情報が必要か判断します。

```
POST /reflection
Content-Type: application/json

{
  "messages": [...],
  "user_message_rev": "鉄鋼材料の焼入れについて詳しく知りたい",
  "model": "gpt-5.2",
  "category": "technical",
  "task": "rag"
}
```

#### 4. マージ

収集した情報をまとめ、最終回答を生成します。

```
POST /merge
Content-Type: application/json

{
  "messages": [...],
  "user_message_rev": "鉄鋼材料の焼入れについて詳しく知りたい",
  "model": "gpt-5.2"
}
```

## 環境変数
```
# Azure AI Agent Service
AZURE_AI_CONNECTION_STRING=<AI Agent Service接続文字列>

# Azure AI Search
AZURE_AISEARCH_ENDPOINT=<AI Search エンドポイント>
AZURE_AISEARCH_FILEPATH=storage_file_path_name
DEFAULT_CATEGORY=<デフォルト検索インデックス>
SEMANTIC_SEARCH_CONFIG=<セマンティック検索設定名>
EMBEDDING_MODEL=<AI Searchのベクトル埋め込みモデル(例:text-embedding-3-large-atd02)>
KEYWORD_SEARCH_COUNT=<キーワード検索の検索数(任意)>
SEMANTIC_SEARCH_COUNT=<セマンティック検索の検索数(任意)>

# Azure CosmosDB
AZURE_COSMOSDB_URI=<CosmosDBのURI>
AZURE_COSMOSDB_DATABASE_NAME=<CosmosDBのデータベース名>
AZURE_COSMOSDB_DICTIONARY_CONTAINER_NAME=dictionary

# Azure OpenAI
LOAD_BALANCER_ENDPOINT=<OpenAI エンドポイント>
AZURE_OPENAI_VERSION=<OpenAIのAPIバージョン(例: 2025-01-01-preview)>

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=<ストレージ接続文字列>
AZURE_STORAGE_TEMPFILE_CONNECTION_STRING=<一時ファイル用ストレージ接続文字列>
AZURE_STORAGE_SRC_CONTAINER=<ソースファイルコンテナ>
AZURE_STORAGE_MARKDOWN_CONTAINER=<マークダウンコンテナ>
AZURE_STORAGE_TEMPFILE_CONTAINER_NAME=<一時ファイルコンテナ>

# 規格検索
TTS_FILE_PREFIX=<TTS規格ファイルプレフィックス(例: 04_インデックスD_AGENT/TTS/)>
JKS_FILE_PREFIX=<JKS規格ファイルプレフィックス(例: 04_インデックスD_AGENT/JKS/)>
TABLE_SEARCH_MODEL=<テーブル検索を行う際のLLMモデル(例: gpt-5.2)>
```

## 設計

### レイヤー構造

1. **コントローラー層** (`function_app.py`)
   - HTTPリクエストの受付と応答の返却
   - 入力の基本的なバリデーション

2. **ユースケース層** (`modules/use_case.py`)
   - ビジネスロジックの実装
   - 複数サービスの連携と調整

3. **サービス層** (`modules/service.py`)
   - 外部リソースとの連携ロジック
   - インフラストラクチャの抽象化

4. **エンティティ層** (`modules/entity.py`)
   - ロジックを持つエンティティ
   - データ構造の定義
   - ロジックを持たない場合は`model.py`に記載

### エージェントツールについて


**エージェントツール** (`modules/agent/tool.py`, `modules/specification/tool.py`)

- LLMで関数呼び出しで使われるツールです。
- 関数の引数にはdescを必ずつけてください。これは関数の内部処理では使わないですが、その関数を呼び出すと判断した意図をLLMに出力させてフロントで表示するためです。
- ドメインごとに分けたい場合は`modules/[domain]/`と分けて作成します
- インフラへの接続の解決はdi_containerで行ってクラスのコンストラクタに渡してください。

### 依存性注入

di_container.py がすべての依存関係を管理します：

- 外部サービスへの接続は DIコンテナを通じて解決
- 環境変数は `_get_env()` メソッドを使用して取得

### エラー処理

エラー処理は `error_handler.py` に集約されています：

- `@azure_function_error_handler` デコレータを使用
- エラーコードとメッセージのマッピング
- 構造化されたエラーレスポンス

## Azure AI Search要件

AI Search インデックスには以下のフィールドが必要です：
- `chunk`: 検索対象テキスト
- `storage_file_path_name`: ソースファイルへのパス
- `vector`: セマンティック検索の埋め込みベクトルフィールド

## CosmosDB要件

- `dictionary`コンテナ

## Azure Storage要件

1. **元ファイルコンテナ** (環境変数: `AZURE_STORAGE_SRC_CONTAINER`)
   - 元の文書ファイル（PDF、DOCX、XLSX、PPTXなど）を格納
   - 検索システムの入力元となるファイルを管理

2. **マークダウンコンテナ** (環境変数: `AZURE_STORAGE_MARKDOWN_CONTAINER`)
   - 文書ファイルをマークダウン形式に変換したファイルを格納

3. **一時ファイルコンテナ** (環境変数: `AZURE_STORAGE_TEMPFILE_CONTAINER_NAME`)
   - 添付されたファイルを読み取る際に使用

## エラーハンドリング

システムは以下のエラーを適切に処理します：

- API制限エラー (429)
- 不正なリクエスト (400)
- コンテンツフィルターエラー
- サービス利用不可エラー (503)
- 内部エラー (500)

## その他モジュール説明

### ファイル処理モジュール

`modules/text/get_file_content`

各種ファイル形式の処理と内容抽出を行います。

- `get_file_content()`: 各種ファイル形式からのテキスト抽出
  - PDF: PyMuPDFによるテキスト抽出
  - DOCX: python-docxによる段落抽出
  - XLSX: openpyxlによるセル内容抽出
  - PPTX: python-pptxによるスライド内容抽出
  - CSV: csvモジュールによる構造化データ処理

### 辞書処理モジュール

`modules/text/dictionary_methods.py`

表記揺れ補正と用語統一を行います。

- `dictionary_registration`: 辞書登録のメイン処理
  - CosmosDBからの辞書データ読み込み
  - 処理時間の計測
- `inconsistency_collector_robust`: 表記揺れ補正
  - ひらがな/カタカナ/漢字の揺れ吸収
  - 編集距離による類似度計算
  - 説明文の自動付与
- `jp2roma`: 日本語のローマ字変換
  - MeCabによる読み取得
  - 表記揺れ検出の正規化
