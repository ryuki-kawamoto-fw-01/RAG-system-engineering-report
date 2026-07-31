# AI Service Infrastructure（hisys/trial環境）

hisys/trial環境のAIサービスインフラストラクチャ。Azure AIサービス群（AI Foundry、AI Search、Document Intelligence、Language、OpenAI等）をデプロイします。`core`環境の出力値を参照して、Private Endpointを作成します。

**用途**:
- AI Foundry（統合AIサービス、プロジェクト管理、モデルデプロイ）の構築
- AI Search（検索サービス、Shared Private Link）の構築
- Document Intelligence（文書解析）の構築
- Language Service（言語処理）の構築
- Azure OpenAI（複数インスタンス、モデルデプロイ）の構築
- 各AIサービス用のPrivate Endpoint作成
- Function AppへのAIサービスロール割り当て

**特徴**:
- Terraform Remote Stateで`core`のVNet、Private DNS Zone、Log Analytics等を参照
- AI Foundryで統合AIサービスとプロジェクトベースのLLM管理を提供
- 複数のAzure OpenAIインスタンス（001、002、003）とモデルデプロイ管理
- Function AppのManaged Identityへのロールベースアクセス制御（RBAC）
- Private EndpointによるセキュアなAIサービスアクセス
- AI Search用のShared Private Link（Storage Account接続用）

---

## 管理対象リソース

### AIサービス層（AI Services Layer）
- **AI Foundry**: Azure AI Foundryサービス（`module.ai_foundry_001`）
  - AI Services Account作成（統合AIサービスエンドポイント）
  - AI Projects作成（プロジェクト単位のモデル管理）
  - モデルデプロイメント管理
  - Function AppへのAIロール割り当て（Azure AI User、Azure AI Administrator、Cognitive Services OpenAI User）
  - 診断設定（allLogs、AllMetrics → Log Analytics）

- **AI Search**: Azure AI Searchサービス（`module.ai_search`）
  - 検索インデックス管理
  - Shared Private Link（Storage Account Blobへの接続）
  - 診断設定（allLogs、AllMetrics → Log Analytics）

- **Document Intelligence**: Azure Document Intelligenceサービス（`module.document_intelligence`）
  - 文書解析（フォーム、レシート、請求書、名刺等）
  - 診断設定（allLogs、AllMetrics → Log Analytics）

- **Language Service**: Azure Languageサービス（`module.language`）
  - テキスト分析（感情分析、キーフレーズ抽出、エンティティ認識等）
  - 診断設定（allLogs、AllMetrics → Log Analytics）

- **Azure OpenAI**: Azure OpenAIサービス（複数インスタンス）
  - OpenAI 001（`module.azure_openai_001`）: GPT-4、GPT-3.5等のモデルデプロイ
  - OpenAI 002（`module.azure_openai_002`）: 追加のOpenAIインスタンス
  - OpenAI 003（`module.azure_openai_003`）: 追加のOpenAIインスタンス
  - Function AppへのOpenAIロール割り当て（Cognitive Services OpenAI User）
  - 診断設定（allLogs、AllMetrics → Log Analytics）

### ネットワーク層（Network Layer - Private Endpoints）
各AIサービス用のPrivate Endpointを作成し、`core`のVNetとPrivate DNS Zoneに接続：
- AI Foundry用Private Endpoint
- AI Search用Private Endpoint
- Document Intelligence用Private Endpoint
- Language Service用Private Endpoint
- Azure OpenAI用Private Endpoint（001、002、003）

### ネットワーク層（Network Layer - Shared Private Links）
- AI Search用Shared Private Link（Storage Account Blobへの接続）

---

## システム全体での役割

「AIサービス提供層」として、hisys/trial環境のAIサービスを管理します。`core`環境のネットワーク基盤を参照し、Function AppsからAIサービスへのセキュアなアクセスを提供します。

**データフロー**:
```
core（VNet作成、Private DNS Zone作成、Storage Account作成、Function Apps作成）
  ↓
Terraform Remote State（coreの出力値をai_serviceに渡す）
  - resource_group_name, resource_group_id
  - subnet_01_id（Private Endpoint接続用）
  - 各Private DNS Zone ID（Cognitive Services、OpenAI、Search）
  - log_analytics_workspace_id（診断設定用）
  - 各Function AppのPrincipal ID（ロール割り当て用）
  ↓
ai_service（coreのVNet・Private DNS Zone情報を参照してAI Foundry、AI Search、Document Intelligence、Language、OpenAI等を作成、Private Endpointを作成、Function Appへロール割り当て）
  ↓
Function Apps → AI Services（Managed Identity認証でAI Foundry、OpenAI、Document Intelligence、Language、AI Searchにアクセス、GPTモデル実行、文書解析、テキスト分析、検索実行）
```

**重要性**: AIサービスが停止するとLLM実行失敗、文書解析失敗、検索失敗でアプリケーション停止。Function AppへのAIロール割り当てが失敗するとManaged Identity認証失敗でシステム停止。

---

## 設計思想

### 責務範囲と境界

**このモジュールが担当**:
- AIサービス（AI Foundry、AI Search、Document Intelligence、Language、Azure OpenAI）の作成
- AIサービス用のPrivate Endpoint作成
- AI Search用のShared Private Link作成
- Function AppへのAIサービスロール割り当て
- AIサービスの診断設定

**このモジュールが担当しない**:
- ネットワーク基盤（VNet、Subnet、Private DNS Zone）→ `core`環境
- データストレージ基盤（Storage Account、Cosmos DB、Key Vault）→ `core`環境
- コンピュート基盤（App Service、Function Apps）→ `core`環境

**分離理由**: AIサービス（頻繁な更新・モデル変更・設定変更）とコアインフラ（安定性重視・長期運用）を分離することで、影響範囲を局所化。`ai_service`の変更時に`core`への影響を最小化。モデル追加、AIサービス設定変更が`core`に影響しない。

### 変更時の注意

⚠️ **`core`環境のデプロイ順序**: `core`を先にデプロイ → `ai_service`をデプロイ（Terraform Remote State参照のため）  
⚠️ **AI Foundry名変更**: AI Services Account再作成 → プロジェクト・モデル消失 → システム停止  
⚠️ **AI Search名変更**: AI Search再作成 → インデックス消失 → 検索失敗  
⚠️ **Azure OpenAI名変更**: OpenAI再作成 → モデルデプロイ消失 → LLM実行失敗  
⚠️ **Document Intelligence、Language名変更**: リソース再作成 → 設定消失  
⚠️ **モデルデプロイメント削除**: Function Appからのモデルアクセス失敗 → LLM実行エラー  
⚠️ **ロール割り当て削除・変更**: Function AppからAIサービスアクセス失敗 → Managed Identity認証エラー  
⚠️ **Private Endpoint削除**: パブリックアクセス不可時にAIサービス接続失敗 → サービス利用不可

---

## ファイル構成

```
ai_service/
├── main.tf           # リソース定義（モジュール呼び出し中心）
├── environment.tf    # 環境変数定義（subscription_id、tenant_id等）
├── locals.tf         # ローカル変数定義（AIサービス名、SKU、モデルデプロイ設定等）
├── outputs.tf        # 出力値定義（AI Search名等）
└── provider.tf       # プロバイダー設定、backend設定
```

**main.tfの構造**: 
- Provider設定
- Data Sources（Terraform Remote State: coreリソース参照）
- AI Services Layer（ai_foundry、ai_search、document_intelligence、language、azure_openai）
- Network Layer（private_endpoint、shared_private_link）

**locals.tfの構造**: 
- 基本設定（subscription_id、tenant_id、location、tags）
- AIサービス設定（ai_foundry、ai_search、document_intelligence、language、azure_openai）
  - AI Foundry: ai_projects、deployments、function_role_assignments
  - AI Search: shared_private_link設定
  - Azure OpenAI: deployments、function_role_assignments

**outputs.tfの構造**: 
- AI Search名（GitHub Actionsで使用）

---

## 使用方法

### 初期化
```bash
cd c:\workspace\01_genashi\original-beta\infra\tenant\hisys\trial\ai_service
terraform init
```

### プラン確認
```bash
terraform plan
```

### デプロイ
```bash
terraform apply
```

### リソース削除
```bash
terraform destroy
```

### デプロイ順序
1. **core環境を先にデプロイ** → VNet、Private DNS Zone、Log Analytics、Function Apps等を作成
2. **ai_service環境をデプロイ** → coreの出力値を参照してAIサービスをデプロイ

⚠️ **重要**: `ai_service`は`core`のTerraform Remote Stateを参照するため、必ず`core`を先にデプロイしてください。逆順でデプロイするとTerraform Remote State参照失敗でエラー。

---

## 入力変数

**Terraform State設定**:
- `tfstate_resource_group_name`: Terraform State用のResource Group名（デフォルト: `rgtfstate`）
- `tfstate_storage_account_name`: Terraform State用のStorage Account名（環境ごとに異なる、デフォルト: `genashitfstate002`）

**Azure認証設定**:
- `subscription_id`: Azure Subscription ID（環境ごとに異なる）
- `tenant_id`: Azure Tenant ID（環境ごとに異なる）

**その他**:
- `init_flag`: 初回実行フラグ（デフォルト: `false`）

⚠️ **変更時の影響**:
- `subscription_id`、`tenant_id`変更 → 別環境へのデプロイ
- `tfstate_storage_account_name`変更 → Terraform State参照先変更 → 別環境の状態を参照

詳細は[environment.tf](environment.tf)を参照。

**locals.tfで定義される主要設定**:
- `location`: リージョン（デフォルト: `japanwest`）
- `ai_foundry`: AI Foundry設定（ai_services_account_name、ai_projects、deployments、function_role_assignments）
- `ai_search`: AI Search設定（name、sku、shared_private_link）
- `document_intelligence`: Document Intelligence設定（name、sku）
- `language`: Language Service設定（name、sku）
- `azure_openai`: Azure OpenAI設定（name、deployments、function_role_assignments）× 3インスタンス

---

## 出力値

| 出力名 | 説明 | 使用先 |
|--------|------|--------|
| `ai_search_service_name` | Azure AI Search サービス名 | GitHub Actions（ai_search.py実行時） |

⚠️ **重要**: AI Search名はGitHub Actionsでインデックス作成時に使用されます。

詳細は[outputs.tf](outputs.tf)を参照。

---

## 依存関係

### 必須依存
- **core環境**: Terraform Remote Stateでcoreの出力値を参照
  - `resource_group_name`、`resource_group_id`
  - `subnet_01_id`（Private Endpoint接続用）
  - `private_dns_zone_cognitive_services_id`、`private_dns_zone_openai_id`、`private_dns_zone_search_service_id`（Private DNS Zone接続用）
  - `log_analytics_workspace_id`（診断設定用）
  - 各Function AppのPrincipal ID（ロール割り当て用）

- **Terraform State用Storage Account**: 事前に`rgtfstate` Resource Group内に`genashitfstate002` Storage Accountが作成されている必要があります。

- **モジュール**: `../../../../modules/`配下の各モジュール（ai_foundry、ai_search、document_intelligence、language、azure_openai、private_endpoint）

### オプション依存
- なし

### 依存先（このモジュールに依存）
- **GitHub Actions**: `ai_search_service_name`を参照してインデックス作成

### data source
- `data "terraform_remote_state" "core"`: coreのTerraform State参照
  - backend: azurerm
  - resource_group_name: `rgtfstate`
  - storage_account_name: `genashitfstate002`
  - container_name: `tfstate`
  - key: `core/terraform.tfstate`

---

## Copilot向け注意事項

### 1. 責務を越える変更禁止
このモジュールはAIサービスのみ担当。ネットワーク基盤、データストレージ、コンピュート基盤は`core`モジュール。

### 2. デプロイ順序厳守
`core` → `ai_service`の順序。逆順でデプロイするとTerraform Remote State参照失敗 → エラー。

### 3. AIサービス名は変更禁止
名前変更 → リソース再作成 → プロジェクト・モデル・インデックス消失 → システム停止

### 4. モデルデプロイメント削除は慎重に
Function Appが使用中のモデルを削除すると、LLM実行失敗 → アプリケーションエラー。

### 5. ロール割り当ては自動実施
Function AppへのAIサービスロール割り当ては、各モジュール内で自動実施。手動追加不要。

### 6. coreの出力値削除・変更に注意
coreの出力値（subnet_id、private_dns_zone_id、log_analytics_workspace_id、function_principal_id等）が削除・変更されると、ai_serviceのデプロイ失敗。

### 7. 診断設定は削除禁止
allLogs、AllMetricsはトラブルシューティング（API呼び出しログ、エラーログ、モデル実行ログ等）に必須。削除 → 障害調査不可。

### 8. AI Foundryの新しいアーキテクチャを理解
AI Services Account配下にAI Projectsを作成し、プロジェクト単位でモデル管理。モジュールが`azapi_resource`を使用。

---

## 動作確認観点

### 1. terraform validate
構文エラーがないことを確認。

### 2. terraform plan
- 意図しない差分がないこと
- AIサービス（AI Foundry、AI Search、Document Intelligence、Language、Azure OpenAI）が作成されること
- AI Foundryでai_projects、deploymentsが正しいこと
- Azure OpenAIでdeploymentsが正しいこと
- Private Endpointが作成されること
- Shared Private Linkが作成されること（AI Search）

### 3. Azureポータル確認
- AI Foundry、AI Search、Document Intelligence、Language、Azure OpenAIが作成されていること
- AI Foundryでプロジェクト、モデルデプロイメントが正しいこと
- Azure OpenAIでモデルデプロイメントが正しいこと
- Private Endpointが各AIサービスに接続されていること
- AI SearchのShared Private Linkが作成されていること
- ロール割り当てが正しいこと（Function App）

### 4. Function Appからのアクセス確認
- Function AppからAI Foundry APIを呼び出し、GPTモデル実行が成功すること
- Function AppからAzure OpenAI APIを呼び出し、モデル実行が成功すること
- Function AppからDocument Intelligence APIを呼び出し、文書解析が成功すること
- Function AppからLanguage Service APIを呼び出し、テキスト分析が成功すること
- Function AppからAI Search APIを呼び出し、検索が成功すること
- Managed Identity認証が成功すること

### 5. 診断ログ確認
- Log Analyticsで`AzureDiagnostics`テーブルにAIサービスログが記録されていること
- API呼び出しログ、モデル実行ログが出力されていること

### 6. ロールバック時の確認
- AIサービス名変更は原則禁止（リソース再作成でプロジェクト・モデル・インデックス消失）
- モデルデプロイメント削除は慎重に（Function Appが使用中のモデル確認後のみ実行）

---

## H推部検証環境デプロイ時の注意点

### 環境概要
- **サブスクリプション**: def81dc7-dd19-48d9-a825-9aeb35274dd4（Ｈ推部_社内業務効率化検証）
- **環境プレフィックス**: "hs"
- **AI Searchサービス名**: srch-genashi-trial-hs
- **Terraform State**: tfstatehsuibu001（rg-tfstate-hsuibu）

### 0. 検証環境固有の設定: init_flagデフォルト値

**検証環境の特別設定**: この環境は本番環境ではなく、RAG比較検証専用のため、`init_flag`のデフォルト値を`true`に設定しています。

**設定内容（environment.tf）**:
```hcl
variable "init_flag" {
  description = "Public access enabled (true) or Private Endpoint enabled (false). 検証環境ではtrue推奨"
  type        = bool
  default     = true  # 検証環境用: Private Endpoint制約を回避
}
```

**効果**:
- ✅ `-var="init_flag=true"`の指定が不要（デプロイコマンドが簡潔に）
- ✅ AIサービスのPublic Network Access維持（外部からのTerraform管理を継続可能）
- ✅ RAGから環境を再構築する際も自動的にtrue適用

**注意事項**:
- ⚠️ この設定は検証専用です
- ⚠️ 本番環境では必ず`default = false`に変更してください（Private Endpoint有効化）
- ⚠️ または`default`を削除し、ワークフローで明示的に値を渡す設計にしてください

**簡潔化されたデプロイコマンド**:
```bash
# 変更前（毎回指定が必要）
terraform plan -var="init_flag=true" -out=tfplan

# 変更後（指定不要）
terraform plan -out=tfplan
```

### 1. OpenAIモデルの変更（deprecation対応）

**変更内容（locals.tf）**:
```hcl
# 変更前（deprecated）
deployments = [
  {
    name    = "gpt-4.1-genashi-trial"
    model   = "gpt-4.1"
    version = "2025-04-14"  # ← deprecated
    sku     = "Standard"
    capacity = 10
  }
]

# 変更後（推奨）
deployments = [
  {
    name    = "gpt-5.2-genashi-trial"
    model   = "gpt-5.2"
    version = "2025-12-11"  # ← 最新安定版
    sku     = "Standard"
    capacity = 10
  }
]
```

**理由**: 
- gpt-4.1およびgpt-4.1-nano（Version 2025-04-14）がdeprecatedエラー
- Azure OpenAIは定期的にモデルバージョンを更新するため、最新版への移行が必要
- AI Foundry、Azure OpenAI Account 01/02/03全てで同様の変更を実施

**影響範囲**: 
- Function Appの`DEPLOYMENT_NAME`環境変数も"gpt-5.2-genashi-trial"に更新必要
- アプリケーションコードでモデル名をハードコードしている場合は修正必要

### 2. init_flag=trueでのデプロイ

**デプロイ手順**:
```bash
# coreを先にデプロイ（必須）
cd ../core
terraform plan -var="init_flag=true" -out=tfplan
terraform apply tfplan

# ai_serviceをデプロイ
cd ../ai_service
terraform plan -var="init_flag=true" -out=tfplan
terraform apply tfplan
```

**init_flag=trueの効果**:
- AIサービスのPublic Network Accessが有効化
- Private Endpointは作成されるが、パブリックアクセスも並行利用可能
- Terraformからの管理操作が可能な状態を維持

### 3. environment_prefixの一貫性

**重要**: coreとai_serviceで同じ`environment_prefix`を使用すること

**過去の失敗例**:
- core: environment_prefix = "hs"
- ai_service: environment_prefix = "97"（誤設定）
- 結果: AI Search名が"srch-genashi-trial-97"になり、62 add/48 destroy/80 totalの大規模変更が発生

**正しい設定**:
```hcl
# core/environment.tf
variable "environment_prefix" {
  default = "hs"
}

# ai_service/environment.tf
variable "environment_prefix" {
  default = "hs"
}
```

### 4. デプロイ実績

**Phase 1（init_flag=true）**:
- AI Foundry: aif-genashi-trial-hs
- AI Search: srch-genashi-trial-hs
- Document Intelligence: di-genashi-trial-hs
- Language Service: lang-genashi-trial-hs
- Azure OpenAI: oai-genashi-trial-hs-01/02/03
- デプロイ結果: 80リソース作成成功

**Phase 2（init_flag=false）**:
- Private Endpoints: 6個作成
- Shared Private Links: AI Search → Storage Account/OpenAI/Cosmos DB/Functions
- Public Network Access: Disabled
- デプロイ結果: 24 added, 6 changed, 20 destroyed

**差分状況（init_flag=true）**:
- terraform plan結果: No changes（差分なし）
- RAG比較検証に最適な状態

### 5. Terraform Remote State参照の確認

**main.tfでの設定**:
```hcl
data "terraform_remote_state" "core" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-tfstate-hsuibu"
    storage_account_name = "tfstatehsuibu001"
    container_name       = "tfstate"
    key                  = "core/terraform.tfstate"
  }
}
```

**確認ポイント**:
- coreのTerraform State保存先と一致していること
- coreが先にデプロイ完了していること
- storage_account_nameがH推部環境固有の値（tfstatehsuibu001）であること

### 6. Azure OpenAI RequestConflict対応

**問題**: 複数のAzure OpenAIインスタンスを同時デプロイ時にRequestConflictエラー

**原因**: Azure Cognitive Servicesの同時操作制限

**対策**: 
```bash
# エラー発生時は30秒待ってリトライ
terraform apply tfplan
# エラーが出た場合
Start-Sleep -Seconds 30
terraform apply tfplan
```

### 7. Private Endpoint化の影響

**init_flag=false時の制約**:
- AI Foundry、AI Search、Document Intelligence、Language、Azure OpenAIが外部ネットワークからアクセス不可
- Terraform実行環境がVNet外部の場合、以下操作が制限：
  - モデルデプロイメント追加・削除
  - AI Search Shared Private Link設定変更
  - AIサービス設定変更

**推奨運用**:
- 検証環境ではinit_flag=trueを維持（RAG比較検証のため）
- 本番環境ではinit_flag=falseでPrivate Endpoint化
- Private Endpoint化後の設定変更はVNet内部のJump Serverから実施

### 8. システム工学レポート用の記録

**変更内容サマリ**:
1. locals.tf: gpt-4.1 → gpt-5.2への全面移行（AI Foundry + OpenAI 3インスタンス）
2. environment.tf: environment_prefix="hs"に統一
3. main.tf: Terraform Remote State参照先をtfstatehsuibu001に変更
4. デプロイ戦略: init_flag=trueでの検証環境運用

**学習ポイント**:
- OpenAIモデルは定期的にdeprecationが発生、最新版への追従が必要
- environment_prefixの不一致は大規模なリソース再作成を引き起こす
- Terraform Remote State参照は環境固有の値に注意
- init_flag=trueは検証環境でのRAG比較に有効
