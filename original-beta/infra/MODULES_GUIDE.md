# Infrastructure Modules - 全体統括ドキュメント (RAG用)

このドキュメントは、infra/modules配下の全モジュールの設計思想、再現方法、共通パターンをまとめたRAG活用用ドキュメントです。

---

## 目次

1. [モジュール全体マップ](#モジュール全体マップ)
2. [共通設計パターン](#共通設計パターン)
3. [モジュール再現の5ステップ](#モジュール再現の5ステップ)
4. [レイヤー別モジュール詳細](#レイヤー別モジュール詳細)
5. [トラブルシューティング](#トラブルシューティング)

---

## モジュール全体マップ

### 19モジュールのレイヤー分類

**Foundation Layer（基盤層）**
- `common`: Resource Group作成
- `log_analytics`: Log Analytics Workspace
- `vnet`: VNet、Subnet、NSG（オプション）
- `private_dns_zone`: Private DNS Zone管理

**Data & Storage Layer（データ・ストレージ層）**
- `storage_account`: Storage Account、Blob、Queue
- `container_registry`: Container Registry
- `cosmos_db`: Cosmos DB、SQL Database、Container
- `key_vault`: Key Vault、Secret管理

**Compute Layer（コンピュート層）**
- `app_service`: App Service Plan、Frontend、LoadBalancer
- `azure_function`: Function App、Application Insights

**AI Services Layer（AIサービス層）**
- `ai_foundry`: AI Services Account、Projects、Deployments
- `ai_search`: AI Search、Indexer
- `document_intelligence`: Document Intelligence
- `microsoft_Foundry_language`: Language Service
- `azure_open_ai`: Azure OpenAI、Models

**Network Layer（ネットワーク層）**
- `private_endpoint`: Private Endpoint作成
- `private_link`: Shared Private Link作成

**Event & Monitoring Layer（イベント・監視層）**
- `event_grid`: Event Grid Topic、Subscription
- `azure_monitor`: Azure Monitor、Alert、Action Group

---

## 共通設計パターン

### パターン1: for_each動的リソース生成

**用途**: 配列/マップから複数リソースを動的作成

**実装例:**
```
コンテナ配列 → for_each展開
for_each = { for c in var.containers : c.name => c }

利点:
- リソース数を柔軟に変更
- 配列への追加/削除で自動管理
- キー（name）による一意性保証
```

**使用モジュール:**
- cosmos_db: databases, containers
- storage_account: containers, queues
- ai_foundry: ai_projects, deployments
- azure_function: ロール割り当て

### パターン2: count条件付きリソース作成

**用途**: 条件に応じてリソース作成/スキップ

**実装例:**
```
count = var.init_flag ? 0 : 1
count = var.enable_XXX ? 1 : 0

利点:
- 段階的デプロイ対応（init_flag）
- オプション機能の有効/無効制御
```

**使用モジュール:**
- 全モジュールの診断設定（init_flag条件）
- storage_account: ライフサイクル管理
- ai_foundry: デフォルトプロジェクト設定

### パターン3: dynamic動的ブロック生成

**用途**: ブロック自体の条件付き生成

**実装例:**
```
dynamic "autoscale_settings" {
  for_each = each.value.autoscale_settings != null ? [each.value.autoscale_settings] : []
  content { ... }
}

利点:
- ブロックの有無を条件制御
- 配列ラップで条件分岐
```

**使用モジュール:**
- cosmos_db: autoscale_settings, geo_location
- azure_function: VNet統合ブロック
- private_endpoint: private_dns_zone_group

### パターン4: merge階層構造展開

**用途**: 2次元配列を1次元に展開

**実装例:**
```
merge([
  for db in var.databases : {
    for container in db.containers :
    "${db.name}-${container.name}" => merge(container, { database_name = db.name })
  }
]...)

利点:
- データベース → コンテナの階層を平坦化
- 1つのfor_eachで全要素管理
```

**使用モジュール:**
- cosmos_db: containers展開

### パターン5: azapi_resource使用

**用途**: ARM API直接呼び出し（azurerm providerで未対応のリソース）

**実装例:**
```
azapi_resource使用:
- ai_foundry: AI Services Account、AI Projects
- azapi_update_resource: プロパティ更新
- azapi呼び出し理由: 最新API対応、プレビュー機能使用

注意:
- API version指定必須
- bodyでJSON定義
- response_export_values = ["*"]で全プロパティ出力
```

**使用モジュール:**
- ai_foundry
- azure_function: VNetルーティング詳細設定

### パターン6: init_flag段階的デプロイ

**用途**: Managed Identity作成順序制約への対応

**理由:**
```
問題: Function AppのManaged Identity作成直後はPrincipal ID未伝播
→ ロール割り当て失敗、Private Endpoint DNS解決失敗

解決策:
1回目（init_flag=true）:
- パブリックアクセス有効
- VNet統合無効
- 診断設定スキップ

2回目（init_flag=false）:
- パブリックアクセス無効
- VNet統合有効
- 診断設定作成
```

**実装パターン:**
```
リソース:
public_network_access_enabled = var.init_flag ? true : false
virtual_network_subnet_id = var.init_flag ? null : var.subnet_id

診断設定:
count = var.init_flag ? 0 : 1
```

**使用モジュール:**
- 全AIサービスモジュール
- storage_account, cosmos_db, key_vault
- azure_function

---

## モジュール再現の5ステップ

### ステップ1: モジュール構造の理解

**確認項目:**
1. README.md「モジュール概要」「システム全体での役割」
2. 作成されるリソース種別
3. 依存関係（必須依存、オプション依存）

**質問例:**
- このモジュールは何を担当するのか？
- 他のどのモジュールに依存するのか？
- どのモジュールから参照されるのか？

### ステップ2: 変数定義の作成

**variables.tfの設計:**
```
1. 必須変数定義:
   - リソース名、ロケーション、リソースグループ
   - Log Analytics Workspace ID（診断設定用）

2. オプション変数:
   - ネットワーク設定（init_flag、public_network_access等）
   - SKU、容量、レプリカ数
   - 機能フラグ（enable_XXX）

3. 複雑な変数:
   - オブジェクト配列（databases, containers, ai_projects等）
   - 型定義、デフォルト値、validation設定
```

**READMEからの情報抽出:**
- 「入力変数」セクションで必須/オプション確認
- 「モジュール再現のための設計ガイド」で変数構造確認
- 「変数設計の重要ポイント」で注意事項確認

### ステップ3: リソース定義の実装

**main.tfの設計:**
```
1. Providerバージョン指定:
   terraform { required_providers { ... } }

2. リソース作成:
   - メインリソース（azurerm_XXX or azapi_resource）
   - for_each/count使用で動的生成
   - dynamicブロックで条件付きブロック

3. data source:
   - ロール定義参照
   - 既存リソース参照（必要な場合）

4. ロール割り当て:
   - azurerm_role_assignment
   - skip_service_principal_aad_check = true

5. 診断設定:
   - azurerm_monitor_diagnostic_setting
   - count = var.init_flag ? 0 : 1
```

**READMEからの情報抽出:**
- 「リソース構成の設計」でリソース階層確認
- 「動的リソース生成」でfor_each/count/dynamicパターン確認
- 共通設計パターン（本ドキュメント）参照

### ステップ4: 出力値定義の作成

**outputs.tfの設計:**
```
1. 必須出力:
   - リソースID（他モジュールのロール割り当て用）
   - Principal ID（Managed Identity）
   - エンドポイントURL（接続用）

2. sensitiveフラグ:
   - 接続文字列、APIキー等にsensitive = true

3. 出力値の用途記載:
   - descriptionで使用先明記
```

**READMEからの情報抽出:**
- 「出力値」セクションで必要な出力確認
- 「依存先（このモジュールに依存）」で参照元確認

### ステップ5: テストと検証

**検証手順:**
```
1. terraform validate
   - 構文エラー確認

2. terraform plan
   - 意図しない差分確認
   - -/+表示（再作成）がないこと確認

3. terraform apply
   - 初回: init_flag=true
   - 2回目: init_flag=false

4. Azure Portal確認:
   - リソース作成確認
   - Managed Identity有効確認
   - ロール割り当て確認
   - Private Endpoint確認

5. 接続テスト:
   - Function Appから対象リソースへアクセス
   - Managed Identity認証確認
```

**READMEからの情報抽出:**
- 「動作確認観点」セクションで確認項目リスト参照
- 「トラブルシューティング」セクションでエラー対処参照

---

## レイヤー別モジュール詳細

### Foundation Layer

#### common モジュール
**責務**: Resource Group作成のみ  
**特徴**: 最もシンプル、全モジュールの前提  
**再現ポイント**: azurerm_resource_group 1リソースのみ

#### log_analytics モジュール
**責務**: Log Analytics Workspace作成  
**特徴**: 全モジュールの診断設定送信先  
**再現ポイント**: sku、retention_in_days設定

#### vnet モジュール
**責務**: VNet、Subnet作成  
**特徴**: 
- Subnet 01: Private Endpoint用
- Subnet 02: Function App VNet統合用（delegation必須）
- NSG: コメントアウト状態（環境により有効化）
**再現ポイント**: 
- delegationとservice_endpointsの組み合わせ
- address_space CIDR設計

#### private_dns_zone モジュール
**責務**: Private DNS Zone、VNet Link作成  
**特徴**: 9種類のDNSゾーン管理（Cognitive Services, OpenAI, Search等）  
**再現ポイント**: for_eachで複数ゾーン展開、VNet Link設定

### Data & Storage Layer

#### storage_account モジュール（詳細ガイド有り）
**責務**: Storage Account、Blob Container、Queue作成  
**特徴**: 
- for_each: containers, queues, folder_placeholders
- lifecycle_management: 自動削除ルール
- 診断設定: Blob Service用、Queue Service用の2つ
**再現ポイント**: 
- network_rules設計
- blob_properties設定
- フォルダプレースホルダ（.keepファイル）

#### cosmos_db モジュール（詳細ガイド有り）
**責務**: Cosmos DB Account、Database、Container作成  
**特徴**: 
- merge: 2次元配列展開
- dynamic: geo_location, autoscale_settings
- consistency_policy, backup必須ブロック
**再現ポイント**: 
- 階層構造展開（Database → Container）
- パーティションキー設計
- 一致性レベル選択

#### container_registry モジュール
**責務**: Container Registry作成  
**特徴**: 
- SKU: Basic/Standard/Premium
- admin_enabled: 通常false（Managed Identity推奨）
- georeplications: Premium SKUでマルチリージョン
**再現ポイント**: 
- SKU選択によるコスト・機能差異
- Function AppへのAcrPullロール割り当て

#### key_vault モジュール
**責務**: Key Vault、Secret管理  
**特徴**: 
- network_acls: IP制限、VNet制限
- access_policy: ロールベース or アクセスポリシー
- purge_protection: 削除保護（本番推奨）
**再現ポイント**: 
- enable_rbac_authorization推奨（アクセスポリシーより柔軟）
- soft_delete_retention_days設定

### Compute Layer

#### app_service モジュール
**責務**: App Service Plan、Frontend、LoadBalancer作成  
**特徴**: 
- os_type: Linux
- sku_name: P0v3, P1v3等
- IP制限設定
- Easy Auth設定（frontend_auth_client_secret）
**再現ポイント**: 
- App Service Plan共有（Frontend, LoadBalancer, Function Apps）
- VNet統合設定

#### azure_function モジュール（詳細ガイド有り）
**責務**: Function App、Application Insights作成  
**特徴**: 
- use_container_image: Python/Docker選択
- VNet統合（init_flag条件）
- azapi_update_resource: VNetルーティング詳細設定
- 多数のロール割り当て（Storage, ACR, Cosmos DB）
**再現ポイント**: 
- application_stack設計
- VNet統合段階的有効化
- 詳細VNetルーティング（imagePullTraffic等）

### AI Services Layer

#### ai_foundry モジュール（詳細ガイド有り）
**責務**: AI Services Account、Projects、Deployments作成  
**特徴**: 
- azapi_resource: AI Services Account、Projects
- azapi_update_resource: デフォルトプロジェクト設定
- for_each: プロジェクト、デプロイメント動的生成
**再現ポイント**: 
- 3段階作成（Account → Projects → Update）
- identity設定（SystemAssigned/UserAssigned）
- モデルデプロイメント管理

#### ai_search モジュール
**責務**: AI Search作成  
**特徴**: 
- SKU: basic, standard, standard2等
- replica_count, partition_count設定
- Shared Private Link（Storage Account接続用）
**再現ポイント**: 
- インデクサー、スキルセット設定（別途）
- ベクトル検索対応

#### azure_open_ai モジュール
**責務**: Azure OpenAI、Model Deployments作成  
**特徴**: 
- azurerm_cognitive_account (kind="OpenAI")
- azurerm_cognitive_deployment: モデルデプロイ
- for_each: 複数モデル管理
**再現ポイント**: 
- model_name, model_version指定
- sku.name, sku.capacity（TPMクォータ）
- version_upgrade_option設定

#### document_intelligence モジュール
**責務**: Document Intelligence作成  
**特徴**: 
- kind="FormRecognizer"
- フォーム、レシート、請求書解析
- カスタムモデル学習可能
**再現ポイント**: 
- SKU選択（S0推奨）
- カスタムモデル学習用のStorage Account接続

#### microsoft_Foundry_language モジュール
**責務**: Language Service作成  
**特徴**: 
- kind="TextAnalytics"
- 感情分析、キーフレーズ抽出、エンティティ認識
**再現ポイント**: 
- SKU選択
- カスタムモデル学習（オプション）

### Network Layer

#### private_endpoint モジュール
**責務**: Private Endpoint作成  
**特徴**: 
- private_service_connection設定
- subresource_names指定（blob, queue, sites等）
- dynamic: private_dns_zone_group（DNS統合）
**再現ポイント**: 
- subresource_names: リソース種別により異なる
  - Storage Account: ["blob"], ["queue"]
  - Cosmos DB: ["Sql"]
  - Key Vault: ["vault"]
  - AI Services: ["account"]
- Private DNS Zone ID配列設定

#### private_link モジュール
**責務**: Shared Private Link作成（AI Search用）  
**特徴**: 
- AI SearchからStorage Accountへの接続
- group_id指定（"blob"等）
- 承認待ち状態になる場合あり
**再現ポイント**: 
- AI Search専用（他サービスはPrivate Endpoint使用）
- Private Link承認フロー

### Event & Monitoring Layer

#### event_grid モジュール
**責務**: Event Grid Topic、Subscription作成  
**特徴**: 
- azurerm_eventgrid_system_topic: Storage Account用
- azurerm_eventgrid_event_subscription: Function App宛
- filter設定（blob作成イベント等）
**再現ポイント**: 
- subject_filter設計
- event_type指定

#### azure_monitor モジュール
**責務**: Alert、Action Group作成  
**特徴**: 
- azurerm_monitor_action_group: 通知先
- azurerm_monitor_metric_alert: メトリクスアラート
- azurerm_monitor_activity_log_alert: アクティビティログアラート
**再現ポイント**: 
- アラートルール設計
- しきい値設定

---

## トラブルシューティング

### エラー: "Principal not found" / "Role assignment failed"

**症状**: Function Appへのロール割り当て失敗

**原因**: Managed Identity作成直後でPrincipal IDがAADに未伝播

**解決手順:**
1. `terraform apply`を再実行（通常30秒-2分で伝播）
2. `skip_service_principal_aad_check = true`設定確認
3. Azure Portal → Function App → Identity で Principal ID確認

**予防策:**
- init_flag段階的デプロイ使用
- ロール割り当てをdepends_onで明示的に遅延

### エラー: "Private Endpoint creation failed"

**症状**: Private Endpoint作成失敗

**原因①**: Private DNS Zone未作成

**解決**: Private DNS Zoneモジュール先にデプロイ

**原因②**: Subnet設定不適切

**解決**: 
- `private_endpoint_network_policies = "NetworkSecurityGroupEnabled"`確認
- Subnet delegation確認（Private Endpoint用サブネットはdelegationなし）

**原因③**: subresource_names不正

**解決**: リソース種別に応じた正しいsubresource_names指定
- Storage Blob: ["blob"]
- Storage Queue: ["queue"]
- Cosmos DB: ["Sql"]

### エラー: "Quota exceeded" / "Insufficient quota"

**症状**: リソース作成失敗（クォータ不足）

**対象リソース**: Azure OpenAI TPM、AI Search replicas等

**解決手順:**
1. Azure Portal → Subscription → Usage + quotas 確認
2. クォータ増加申請
3. 別リージョンでデプロイ
4. capacity/replica数削減

### エラー: "Name already exists" / "Name not available"

**症状**: リソース名重複エラー

**対象**: Storage Account, Cosmos DB等（グローバル一意名必要）

**解決**: 
- environment_prefix使用（例: 環境番号を接頭辞に）
- ランダムサフィックス追加
- リージョンコード追加（例: -japaneast）

### エラー: "VNet integration failed"

**症状**: Function App VNet統合失敗

**原因①**: Subnet delegation未設定

**解決**: `delegation = "Microsoft.Web/serverFarms"`設定

**原因②**: init_flag=trueで統合試行

**解決**: init_flag=false時のみVNet統合有効化

**原因③**: Subnet容量不足

**解決**: Subnet address_prefixを/26以上に拡大

### エラー: "Diagnostic settings creation failed"

**症状**: 診断設定作成失敗

**原因**: init_flag=true時に作成試行

**解決**: count条件確認（count = var.init_flag ? 0 : 1）

---

## RAG活用ガイド

### このドキュメントの使い方

**1. モジュール概要確認:**
- "XXXモジュールの責務は？" → レイヤー別モジュール詳細参照

**2. 設計パターン確認:**
- "for_eachの使い方は？" → 共通設計パターン参照
- "init_flagの意味は？" → パターン6参照

**3. 再現手順確認:**
- "モジュールを作るには？" → モジュール再現の5ステップ参照

**4. エラー解決:**
- "Principal not foundエラーは？" → トラブルシューティング参照

**5. 詳細設計確認:**
- 主要5モジュール（ai_foundry, cosmos_db, storage_account, vnet, azure_function）は各モジュールREADMEの「モジュール再現のための設計ガイド」参照
- 他14モジュールはレイヤー別モジュール詳細（本ドキュメント）参照

### コード生成時の注意

**このドキュメントには具体的なコードサンプルは含まれません。**

理由: 学習目的のため、設計思想とパターンのみ提供

**コード参照先:**
1. variables.tf: 変数定義
2. main.tf: リソース定義
3. outputs.tf: 出力値定義

**推奨アプローチ:**
1. このドキュメントで設計理解
2. 各モジュールREADMEで詳細確認
3. variables.tf/main.tf/outputs.tfで実装確認
4. パターンを応用して新規モジュール作成

---

## 更新履歴

- 2026-07-09: 初版作成
  - 全19モジュール概要
  - 共通設計パターン6種
  - モジュール再現5ステップ
  - レイヤー別詳細
  - トラブルシューティング
