# 製造現場 アシスタント AI

## 事前準備

以下が必要になるため準備する。

- VsCode
- Git, Github アカウント
- Docker
- Azure アカウント
- Azure リソース
  - App Service, Function, CosmosDB, OpenAI

## 技術スタック

本リポジトリでは、以下の言語やフレームワークを使用している。

フロントエンド： TypeScript, React, Next.js（App Router）<br>
バックエンド：Python, Node.js

## ディレクトリ構成（フロントエンド）

```
└─src
    └─app
        │  favicon.ico
        │  globals.css
        │  layout.tsx   # 共通レイアウト
        │  page.tsx     # 共通ページ
        │
        ├─api
        │  ├─chat
        │  |       route.ts   # チャット機能のAPIエンドポイント（バックエンド連携）
        |  |
        │  ├─get-file
        |  |       route.ts   # 文書情報取得機能のAPIエンドポイント（バックエンド連携）
        |  |
        |  └─rag-chat
        |          route.ts   # 文書検索機能のAPIエンドポイント（バックエンド連携）
        │
        ├─chat
        │  │  layout.tsx
        │  │  page.tsx   # チャットページ
        │  │
        │  ├─[id]
        │  │  │  page.tsx   # ダイナミックルーティングを使用してスレッドIDごとのページを表示
        │  │  │
        │  │  ├─_actions
        │  │  │       getChatThread.ts   # 特定のスレッドIDに関連するデータを取得するアクション関数
        │  │  |       ...
        │  │  │
        │  │  └─_components
        │  │          chat-message.tsx   # 特定のスレッドIDに関連するチャットコンポーネント
        │  │          ...
        │  │
        │  ├─_actions
        │  │       clearChatThread.ts   # チャットスレッドのデータを取得するアクション関数
        │  │       ...
        │  │
        │  └─_components
        │          clear-thread-button.tsx   # チャット関連の自作コンポーネント
        │          ...
        │
        ├─rag-chat
        │  │  layout.tsx
        │  │  page.tsx   # 文書検索ページ
        │  │
        │  ├─[id]
        │  │  │  page.tsx   # ダイナミックルーティングを使用してスレッドIDごとのページを表示
        │  │  │
        │  │  ├─_actions
        │  │  │       getChatThread.ts   # 特定のスレッドIDに関連するデータを取得するアクション関数
        │  │  |       ...
        │  │  │
        │  │  └─_components
        │  │          chat-message.tsx   # 特定のスレッドIDに関連するチャットコンポーネント
        │  │          ...
        │  │
        │  ├─_actions
        │  │       clearChatThread.ts   # チャットスレッドのデータを取得するアクション関数
        │  │       ...
        │  │
        │  └─_components
        │          clear-thread-button.tsx   # チャット関連の自作コンポーネント
        │          ...
        │
        ├─document-register
        │  │  layout.tsx
        │  │  page.tsx   # 文章登録ページ
        │  │
        │  └─_components
        │          manage-files.tsx   # インデックス選択の自作コンポーネント
        │          ...
        │
        ├─template-register
        │  │  layout.tsx
        │  │  page.tsx   # プロンプトテンプレート登録ページ
        │  │
        │  ├─_actions
        │  │       createPromptTemplates.ts   # テンプレートを新規作成するアクション関数
        │  |       ...
        │  │
        │  └─_components
        │          create-template-button.tsx   # テンプレート新規作成ボタンの自作コンポーネント
        │
        ├─_components
        │  └─ui
        │          avatar.tsx   # shadcn/ui（https://ui.shadcn.com/）からinstallした共通コンポーネント
        │          button.tsx
        │          ...
        │
        └─_utils
                tw-merge.ts　# UI関連のユーティリティ関数
                ...
```

## セットアップ

以下の手順でセットアップを行う。<br>
尚、詳細な開発手順については[Docker 開発フロー](https://startrain.backlog.com/alias/wiki/3955440)を参考にすること。

### フロントエンド

DevContainer の起動後、以下の設定を行う。

1. 環境変数の設定

   以下の環境変数を App Service へ設定する。

    - AZURE_COSMOSDB_DATABASE_NAME: CosmosDB のデータベース名
    - AZURE_COSMOSDB_MESSAGE_CONTAINER_NAME: チャットのメッセージ管理用のコンテナ名
    - AZURE_COSMOSDB_THREAD_CONTAINER_NAME: チャットのスレッド管理用のコンテナ名
    - AZURE_COSMOSDB_AGENT_MESSAGE_CONTAINER_NAME: AIエージェントのメッセージ管理用のコンテナ名
    - AZURE_COSMOSDB_AGENT_THREAD_CONTAINER_NAME: AIエージェントのスレッド管理用のコンテナ名
    - AZURE_COSMOSDB_RAG_MESSAGE_CONTAINER_NAME: 文書検索のメッセージ管理用のコンテナ名
    - AZURE_COSMOSDB_RAG_THREAD_CONTAINER_NAME: 文書検索のスレッド管理用のコンテナ名
    - AZURE_COSMOSDB_TEMPLATE_CONTAINER_NAME: テンプレート管理用のコンテナ名
    - AZURE_COSMOSDB_BAN_WORD_CONTAINER_NAME: 禁止ワード管理用のコンテナ名
    - AZURE_COSMOSDB_QA_CONTAINER_NAME: Q&A管理用のコンテナ名
    - AZURE_COSMOSDB_USE_CASE_CONTAINER_NAME: ユースケース検索画面用のコンテナ名
    - AZURE_COSMOSDB_URI: CosmosDB の URI
    - AZURE_COSMOSDB_AGENT_MESSAGE_CONTAINER_NAME: AI エージェントで使うメッセージ管理用のコンテナ名
   - AZURE_COSMOSDB_AGENT_THREAD_CONTAINER_NAME: AI エージェントで使うスレッド管理用のコンテナ名
    - ORCHESTRATOR_API_URL: オーケストレータの URL（Azure Function の関数の URL or ローカルホストの URL）
    - ORCHESTRATOR_RAG_API_URL: オーケストレータ RAG(rag_chat)の URL（Azure Function の関数の URL or ローカルホストの URL）
    - ORCHESTRATOR_RAG_API_URL2: オーケストレータ RAG(get_file)の URL（Azure Function の関数の URL or ローカルホストの URL）
    - ORCHESTRATOR_DOCUMENT_API_ENDPOINT: 文書管理のバックエンド URL（Azure Function の関数の URL or ローカルホストの URL）
    - ORCHESTRATOR_DOCUMENT_API_CREDENTIAL: 文書管理のバックエンド URL の認証鍵
    - ORCHESTRATOR_FILE_API_ENDPOINT: ファイルアップロードのバックエンドのエンドポイント
    - ORCHESTRATOR_FILE_API_CREDENTIAL: ファイルアップロードのバックエンドのアクセストークン
    - ORCHESTRATOR_PII_API_URL: PIIのURL（Azure Function の関数の URL or ローカルホストの URL）
    - ORCHESTRATOR_USE_CASE_API_ENDPOINT: ユースケースのバックエンド URL（Azure Function の関数の URL or ローカルホストの URL）
    - ORCHESTRATOR_USE_CASE_API_CREDENTIAL: ユースケースのバックエンド URL の認証鍵
    - ORCHESTRATOR_IT_API_ENDPOINT:ユースケース(IT 関連)のックエンド URL（Azure Function の関数の URL or ローカルホストの URL）
    - ORCHESTRATOR_IT_API_CREDENTIAL: ユースケース(IT 関連)のバックエンド URL の認証鍵
    - ORCHESTRATOR_MFG_API_ENDPOINT: :ユースケース(製造関連)のバックエンド URL（Azure Function の関数の URL or ローカルホストの URL）
    - ORCHESTRATOR_MFG_API_CREDENTIAL: ユースケース(製造関連)のバックエンド URL の認証鍵
    - ORCHESTRATOR_AGENT_API_ENDPOINT: AI エージェント(規格検索)のバックエンド URL（Azure Function の関数の URL or ローカルホストの URL）
    - ORCHESTRATOR_AGENT_API_CREDENTIAL: AI エージェント(規格検索)のバックエンド URL の認証鍵
    - ORCHESTRATOR_STANDARD_API_ENDPOINT: ファイルアップロードのバックエンドのエンドポイント
    - NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME: フロントエンドで利用する規格登録用のストレージコンテナ名
    - NEXT_PUBLIC_STANDARD_PREVIEW_STORAGE_CONTAINER_NAME: フロントエンドで利用する規格検索用のストレージコンテナ名
    - FILE_PREVIEW_CONTAINER_NAME: 文書登録画面のファイルプレビュー用のストレージコンテナ名(OfficeファイルをPDFにしたコンテナ)
    - ORCHESTRATOR_STANDARD_API_CREDENTIAL: ファイルアップロードのバックエンドのアクセストークン
    - INFORMATION: お知らせに表示する文章
    - NEXT_PUBLIC_DISABLED_ROUTE_PREFIXES(任意): 使わない機能のパスを,区切りで指定。(例: create-idea,corporate-survey,chat,design-document-review)

2. App Service 認証

   ポータルから、Microsoft EntraID 認証を有効にする。

3. `.env.local`の作成

   本リポジトリ直下に`env.sample`があるので、ファイル名を`.env.local`に変名する。<br>
   手順 1 で設定した環境変数と同じ値を設定し保存する。<br>
   ローカル開発環境で CosmosDB にアクセスするためには、固定値のユーザー情報(`DEV_USER_ID`,`DEV_USER_NAME`,`DEV_USER_EMAIL`)を設定する必要がある。設定値は他のエンジニアの方に共有してもらってください。<br>
   ※これを作成しておかないと、手順 4 でのローカルビルド時にエラーになる

4. ソースコードのビルド

   コードの変更を行うたびに、ビルドを行うこと。<br>
   ※ビルドが成功した場合のみ、次のセクションにてデプロイすること。

   ```
   npm run build
   ```

5. Azure App Service へのデプロイ

   vscode の拡張機能より、「Deploy to Web App...」を選択し、デプロイする。<br>
   ポータルの「デプロイメント」 -> 「デプロイセンター」 -> 「ログ」からデプロイ状況を確認し、状態が「成功（アクティブ）」になっていれば、デプロイ後のアプリにアクセスできる。

### バックエンド

DevContainer の起動後、以下の設定を行う。

1. 環境変数の設定

   以下の環境変数を Azure Function へ設定する。

   chat

    - LOAD_BALANCER_ENDPOINT: ロードバランサー（App Service） のエンドポイント
    - AZURE_OPENAI_VERSION: Azure OpenAI のバージョン
    - MODEL_IDENTIFIER: モデルデプロイ名の識別子
    - TEMPFILE_CONTAINER_NAME: アップロードファイルの一時保存コンテナ
    - TEMPFILE_CONNECTION_STRING: アップロードファイルの一時保存コンテナの接続認証文字列

   rag(AI エージェントの機能もこちらに追加しております)

    - LOAD_BALANCER_ENDPOINT: Azure OpenAI のエンドポイント
    - AZURE_OPENAI_VERSION: Azure OpenAI のバージョン(2025-01-01-preview)

    - TOP_P: top P(核サンプリング) の値
    - AZURE_AISEARCH_ENDPOINT: Azure AI Search のエンドポイント
    - AZURE_AISEARCH_INDEX: Azure AI Search の対象インデックス
    - AZURE_AISEARCH_STRICTNESS: Strictness(厳格度) の値
    - AZURE_AISEARCH_TOPNDOCUMENTS: Top N Documents(取得文書数) の値
    - AZURE_AISEARCH_TOPNDOCUMENTS_QA: Top N Documents(取得文書数) の値(Q&A用)
    - AZURE_AISEARCH_QA_INDEX: Azure AI Search の対象インデックス(Q$A用)
    - AZURE_AISEARCH_QA_ID_FIELD: QA検索のIDフィールド
    - AZURE_AISEARCH_QA_QUESTION_FIELD: QA検索の質問フィールド
    - AZURE_AISEARCH_QA_ANSWER_FIELD: QA検索の回答フィールド
    - AZURE_AISEARCH_QA_VECTOR_FIELD: QA検索のベクトルフィールド
    - AZURE_AISEARCH_QA_SEMANTIC_CONFIG: QA検索のセマンティック設定
    - AZURE_STORAGE_CONNECTION_STRING: Azure Blob Storage の接続文字列
    - AZURE_STORAGE_CONTAINER: Azure Blob Storage のコンテナ名
    - DOWNLOAD_STORAGE_CONTAINER: Azure Blob Storage のコンテナ名
    - EMBEDDING_MODEL: ベクトル検索用のモデル
    - RAG_SYSTEM_MESSAGE_REF: RAG 検索用のシステムメッセージ(あなたはプロンプト内の引用情報を活用して質問に答えるチャットボットです。\n 引用情報セクションを元に回答してください。\n 引用する必要がない段落には空のリストを出力してください。)
    - MODEL_IDENTIFIER: モデルデプロイ名の識別子
    - AZURE_COSMOSDB_URI: CosmosDB の URI
    - AZURE_COSMOSDB_DATABASE_NAME: CosmosDB のデータベース名
    - AZURE_COSMOSDB_DICTIONARY_CONTAINER_NAME: 辞書登録用のコンテナ名
    - DEFAULT_CATEGORY:インデックスが選択されていない時に使用されるデフォルトのインデックス
    - TEMPFILE_CONTAINER_NAME: アップロードファイルの一時保存コンテナ
    - TEMPFILE_CONNECTION_STRING: アップロードファイルの一時保存コンテナの接続認証文字列
    - AZURE_AI_CONNECTION_STRING: Azure AI Agent Service の接続文字列
    - SEMANTIC_SEARCH_CONFIG: セマンティック検索の設定名
    - TTS_FILE_PREFIX: TTS ファイルが保存されているディレクトリなどの blob パスの prefix
    - JKS_FILE_PREFIX: JKA ファイルが保存されているディレクトリなどの blob パスの prefix

   text-register

   - AZURE_STORAGE_CONNECTION_STRING: ストレージの接続認証文字列(以下のコンテナで共通)
   - AZURE_STORAGE_CONTAINER: 文書登録のファイルを保存するコンテナ名
   - AZURE_STORAGE_SPLIT_FILE_CONTAINER: 分割した ファイル が保存されるコンテナ

   prompt

    - LOAD_BALANCER_ENDPOINT: ロードバランサー（App Service） のエンドポイント
    - AZURE_OPENAI_VERSION: Azure OpenAI のバージョン
    - MODEL_IDENTIFIER: モデルデプロイ名の識別子

   it

    - AZURE_OPENAI_ENDPOINT: Azure OpenAI のエンドポイント
    - AZURE_OPENAI_VERSION: Azure OpenAI のバージョン
    - MODEL_IDENTIFIER: モデルデプロイ名の識別子

   pii

   - LANGUAGE_ENDPOINT: TextAnalytics のエンドポイント

   mfg

   - PROJECT_CONNECTION_STRING: Azure AI Foundry AI のプロジェクト接続文字列
   - DEPLOYMENT_NAME: デプロイ名
   - AGENT_DEPLOYMENT_NAME: agent用デプロイ名
   - AZURE_DOCUMENT_ENDPOINT:DI のエンドポイント
   - LOAD_BALANCER_ENDPOINT: Azure OpenAI のエンドポイント
   - AZURE_OPENAI_VERSION: Azure OpenAI のバージョン
   - AZURE_AISEARCH_ENDPOINT: Azure AI Search のエンドポイント
   - AZURE_AISEARCH_INDEX: Azure AI Search の対象インデックス
   - EMBEDDING_MODEL: ベクトル検索用のモデル

   agent

   - LOAD_BALANCER_ENDPOINT: Azure OpenAI のエンドポイント
   - AZURE_OPENAI_VERSION: Azure OpenAI のバージョン(2025-01-01-preview)
   - TEMPERATURE: temperature(温度) の値
   - TOP_P: top P(核サンプリング) の値
   - AZURE_AISEARCH_ENDPOINT: Azure AI Search のエンドポイント
   - AZURE_AISEARCH_INDEX: Azure AI Search の対象インデックス
   - AZURE_AISEARCH_TITLE: Azure AI Search のタイトルフィールド
   - AZURE_AISEARCH_FILEPATH: Azure AI Search のファイルパスフィールド
   - AZURE_AISEARCH_STRICTNESS: Strictness(厳格度) の値
   - AZURE_AISEARCH_TOPNDOCUMENTS: Top N Documents(取得文書数) の値
   - AZURE_AISEARCH_TOPNDOCUMENTS_QA: Top N Documents(取得文書数) の値(Q&A 用)
   - AZURE_AISEARCH_QA_INDEX: Azure AI Search の対象インデックス(Q$A 用)
   - AZURE_AISEARCH_QA_ID_FIELD: QA 検索の ID フィールド
   - AZURE_AISEARCH_QA_QUESTION_FIELD: QA 検索の質問フィールド
   - AZURE_AISEARCH_QA_ANSWER_FIELD: QA 検索の回答フィールド
   - AZURE_AISEARCH_QA_VECTOR_FIELD: QA 検索のベクトルフィールド
   - AZURE_AISEARCH_QA_SEMANTIC_CONFIG: QA 検索のセマンティック設定
   - AZURE_STORAGE_CONNECTION_STRING: Azure Blob Storage の接続文字列
   - AZURE_STORAGE_CONTAINER: Azure Blob Storage のコンテナ名
   - EMBEDDING_MODEL: ベクトル検索用のモデル
   - RAG_SYSTEM_MESSAGE_DEC: RAG 検索判断用のシステムメッセージ(あなたは優秀な AI チャットボットです。社内情報を聞かれた時はツールを使ってください。)
   - RAG_SYSTEM_MESSAGE_REF: RAG 検索用のシステムメッセージ(あなたはプロンプト内の引用情報を活用して質問に答えるチャットボットです。\n 引用情報セクションを元に回答してください。\n 引用する必要がない段落には空のリストを出力してください。)
   - MODEL_IDENTIFIER: モデルデプロイ名の識別子
   - AZURE_COSMOSDB_URI: CosmosDB の URI
   - AZURE_COSMOSDB_DATABASE_NAME: CosmosDB のデータベース名
   - AZURE_COSMOSDB_DICTIONARY_CONTAINER_NAME: 辞書登録用のコンテナ名
   - DEFAULT_CATEGORY:インデックスが選択されていない時に使用されるデフォルトのインデックス
   - TEMPFILE_CONTAINER_NAME: アップロードファイルの一時保存コンテナ
   - TEMPFILE_CONNECTION_STRING: アップロードファイルの一時保存コンテナの接続認証文字列
   - AZURE_AI_CONNECTION_STRING: Azure AI Agent Service の接続文字列
   - SEMANTIC_SEARCH_CONFIG: セマンティック検索の設定名
   - TTS_FILE_PREFIX: TTS ファイルが保存されているディレクトリなどの blob パスの prefix
   - JKS_FILE_PREFIX: JKA ファイルが保存されているディレクトリなどの blob パスの prefix

    agent

    詳細は[Orchestrator AgentのREADME](/backend/orchestrator-agent/README.md)を参照してください。

   changedoc/pagesplitter

   - AZURE_BLOB_STORAGE_SRC_CONTAINER: 元ファイルのコンテナ(文書登録画面などのファイルのアプロード先)
   - AZURE_BLOB_STORAGE_SRC_CON_STR: 元ファイルのコンテナの接続認証文字列
   - AZURE_BLOB_STORAGE_DST_CONTAINER: 分割した ファイル が保存されるコンテナ
   - AZURE_BLOB_STORAGE_DST_CON_STR: 分割した ファイル が保存されるコンテナの接続認証文字列

   changedoc/markdown

   - AZURE_BLOB_STORAGE_SRC_CONTAINER: 元ファイルのコンテナ(文書登録画面などのファイルのアプロード先)
   - AZURE_BLOB_STORAGE_DST_CONTAINER: 処理されたファイルが保存されるコンテナ
   - AZURE_BLOB_STORAGE_SRC_CON_STR: 元ファイルのコンテナの接続認証文字列
   - AZURE_BLOB_STORAGE_DST_CON_STR: 処理されたファイルが保存されるコンテナの接続認証文字列
   - AZURE_DI_DST_ENDPOINT: Document Intelligence のエンドポイント

   changedoc/converttopdf

   - AZURE_BLOB_STORAGE_SRC_CONTAINER: 元ファイルのコンテナ(文書登録画面などのファイルのアプロード先)
   - AZURE_BLOB_STORAGE_DST_CONTAINER: 処理されたファイルが保存されるコンテナ
   - AZURE_BLOB_STORAGE_SRC_CON_STR: 元ファイルのコンテナの接続認証文字列
   - AZURE_BLOB_STORAGE_DST_CON_STR: 処理されたファイルが保存されるコンテナの接続認証文字列

   ローカルで Function を起動させたい場合、コマンドパレット（Ctrl + Shift + P）を開き、**Azure Function: Download Remote Settings**を選択する。<br>
   上記で設定した Function のリソースを選択 ->ダイアログが出現したら、「yse at all」を選択することで、`local.settings.json`をセットアップする。<br>
   ⇒ Azure 上の環境変数の設定をそのままローカルに反映できる

2. DevContainer 内でのサーバ起動＆テスト

   DevContainer 内で`Azure Functions Core Tools`を使用できるようセットアップしてある。<br>
   そのため、以下の手順を行うことで、フロントエンドと繋がなくとも開発した API のテスト、疎通確認を実施できる。<br>

   1. `local.settings.json`をセットアップ

      手順 1 で設定した環境変数を`local.settings.json`に記述する。<br>
      上記に記載の**Azure Function: Download Remote Settings**の機能を使用すると便利なので、これを使用して設定する。<br>

   2. Azure Function のローカル実行

      以下のコマンドを実行し、サーバを起動させる。

      ```
      func start
      ```

   3. API テスト、疎通確認

      サーバの起動を確認後、`RestClient`を使用して API テストを行うことが出来る。<br>
      `http-test/test.http`を用意してあるので、これを使用する。自由に編集して OK。<br>
      `test.http`を開き、**Send Request**（POST の上部に表示されている）を押下することで、API リクエストを送信することが出来る。<br>
      ※ 本操作を行う際は、上記で起動したサーバを起動し続けておく必要がある。サーバを起動していない状態で**Send Request**を押下してもエラーになるため注意。<br>

3. Azure Function へのデプロイ

   vscode の拡張機能より、「Deploy to Function App...」を選択し、デプロイする。<br>

### ログ取得ツール使用手順

1.  環境変数を設定

    vscode で`original`フォルダを開く。<br>
    その後、`Tools\get-log\.env.sample`を開き、環境変数を設定する。<br>
    ファイル名を`.env.sample`から`.env`に修正する。<br>

    #### 1.1 rocketboostlabs で実行する場合

    データベースキー認証で Cosmos DB にアクセスする。<br>
    そのため環境変数は以下を設定する。<br>

    - URI: COSMOSDB アカウントのエンドポイント
    - DATABASE_KEY: Cosmos DB のデータベースにアクセスするための認証キー
    - DATABASE_NAME: Cosmos DB のデータベースの名前

    #### 1.2 rengoku3 で実行する場合

    マネージド ID 認証で Cosmos DB にアクセスする。<br>
    そのため環境変数は以下を設定する。<br>

    - URI: COSMOSDB アカウントのエンドポイント
    - DATABASE_NAME: Cosmos DB のデータベースの名前

2.  必要なパッケージのインストール

    vscode のターミナルを開き、以下コマンドで作業ディレクトリを移動する。

    ```
    cd Tools\get-log
    ```

    以下コマンドでパッケージをインストールする。<br>
    (最新バージョンでインストールされる)<br>

    ```
    pip install -r requirements.txt
    ```

3.  ログ取得ツール(python ファイル)の実行

    #### 3.1 rocketboostlabs で実行する場合

    `Tools\get-log\rocketboostlabs`配下の python ファイルを実行する。<br>

    - 画面ごとに python ファイルが分かれているため、ログを取得したい画面の python ファイルを実行
    - 具体的には vscode 上で実行したい python ファイルを開いた状態で、右上の「▷」ボタンを押下

    #### 3.2 rengoku3 で実行する場合

    ##### 3.2.1 マネージド ID 認証に対応している azure アカウントでログイン

    ①vscode ターミナル上で以下コマンドを実行

    ```
    az login -u [Azureアカウント名]
    ```

    ② パスワード入力<br>
    ③ 以下コマンドでログインできていることを確認

    ```
    az account show
    ```

    ##### 3.2.2 `Tools\get-log\rengoku3`配下の python ファイルを実行する。

    - 画面ごとに python ファイルが分かれているため、ログを取得したい画面の python ファイルを実行
    - 具体的には vscode 上で実行したい python ファイルを開いた状態で、右上の「▷」ボタンを押下

4.  ファイル保存

    python ファイルを実行すると、explorer 画面が自動で表示されるため、<br>
    出力ファイル(Excel)の保存先を指定する。<br>

    - Excel ファイルを新規で作成可能
    - 既存の Excel ファイルに対して上書き保存することも可能。<br>ただしファイルを開いている状態で選択するとエラーが発生するため、ファイルを閉じた状態で選択する。

5.  実行結果確認

    vscode ターミナルに以下メッセージが表示されれば完了<br>
    `Excelファイルを[指定したファイル保存先]に出力しました。`

## 開発上の注意点

- 本リポジトリは、App Service 認証（Easy Auth）を前提としたフロントエンドのコードとなっているため、ローカルで動作確認をすることが出来ないです。
- 原則、DevContainer内で開発を行ってください。これにより、全ての開発者の環境が統一され、フォーマッターも適用されるため、コードの一貫性が保たれます。
- 但し、開発環境の効率を重視しているため、DevContainer内ではgitコマンドが使用出来ません。git操作についてはコンテナ外で行うようにしてください。

## AIエージェントページの補足

AIエージェントのページは動的ルーティングで、AIエージェントのロジックが変わります。以下のようにルーティングされております。

- `/agent/rag`: 文書検索を行うエージェントです。
- `/agent/specification`: 規格検索を行うエージェントです。
- `/agent/multi-agent`: 文書検索をマルチエージェントで行います。
