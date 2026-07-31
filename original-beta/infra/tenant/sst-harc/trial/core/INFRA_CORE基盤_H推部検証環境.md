# Core Infrastructure（hisys/trial環境）

hisys/trial環境のコアインフラストラクチャ。アプリケーション実行基盤（VNet、Storage、Cosmos DB、App Service、Function Apps等）をデプロイします。`ai_service`環境から参照される共通基盤層です。

**用途**:
- ネットワーク基盤（VNet、Subnet、Private DNS Zone）の構築
- データストレージ基盤（Storage Account、Cosmos DB、Key Vault、Container Registry）の構築
- コンピュート基盤（App Service Plan、Frontend、LoadBalancer、各種Function Apps）の構築
- Private Endpointによるセキュアなネットワーク接続
- Log Analyticsによるログ収集・監視基盤

**特徴**:
- モジュール呼び出しによる構造化されたリソース管理
- Terraform Remote Stateで`ai_service`へ出力値を提供
- Private DNS Zoneを複数管理（Cognitive Services、OpenAI、Search、Blob、Queue、Key Vault、Cosmos DB、Container Registry、App Service）
- 各Function AppにManaged Identity設定済み

---

## 管理対象リソース

### 基盤リソース層（Foundation Layer）
- **Resource Group**: リソースグループ作成（`module.common`）
- **Log Analytics Workspace**: ログ収集・分析基盤（`module.log_analytics`）
- **Virtual Network**: VNet、Subnet、NSG構成（`module.vnet`）
- **Private DNS Zone**: 9種類のプライベートDNSゾーン
  - Cognitive Services（`privatelink.cognitiveservices.azure.com`）
  - OpenAI（`privatelink.openai.azure.com`）
  - Search Service（`privatelink.search.windows.net`）
  - App Service（`privatelink.azurewebsites.net`）
  - Blob Storage（`privatelink.blob.core.windows.net`）
  - Queue Storage（`privatelink.queue.core.windows.net`）
  - Key Vault（`privatelink.vaultcore.azure.net`）
  - Cosmos DB（`privatelink.documents.azure.com`）
  - Container Registry（`privatelink.azurecr.io`）

### データ・ストレージ層（Data & Storage Layer）
- **Storage Account**: Blob、Queueストレージ（`module.storage_account`）
- **Container Registry**: Dockerイメージレジストリ（`module.container_registry`）
- **Cosmos DB**: NoSQLデータベース、複数コンテナ管理（`module.cosmos_db`）
- **Key Vault**: シークレット・証明書管理（`module.key_vault`）

### コンピュート層（Compute Layer）
- **App Service Plan**: Frontend/LoadBalancer用のApp Service Plan（`module.app_service_plan`）
- **Frontend App Service**: フロントエンドアプリケーション（`module.appservice_frontend`）
- **LoadBalancer App Service**: ロードバランサー（`module.appservice_loadbalancer`）
- **Azure Functions**: 14種類のFunction Apps
  - agent_document, agent_rag, chat, indexer
  - markdown_001, markdown_002, mfg
  - pagespliter_001, pagespliter_002
  - pdf, pii, prompt, rag, register

### ネットワーク層（Network Layer - Private Endpoints）
各リソース用のPrivate Endpointを作成し、パブリックアクセスを制限：
- Storage Account（blob、queue）
- Container Registry
- Cosmos DB
- Key Vault
- App Services（frontend、loadbalancer）
- Azure Functions（全14種類）

### イベント・監視層（Event & Monitoring Layer）
- **Event Grid**: イベント駆動処理のトピック・サブスクリプション（`module.event_grid`）
- **Azure Monitor**: アラート・アクショングループ設定（`module.azure_monitor`）

---

## システム全体での役割

「コアインフラ層」として、hisys/trial環境の基盤リソースを管理します。`ai_service`環境はこの環境の出力値を参照してAIサービスをデプロイします。

**データフロー**:
```
core（Resource Group作成、VNet作成、Private DNS Zone作成、Storage Account作成、Cosmos DB作成、Key Vault作成、App Service作成、Function Apps作成、Private Endpoint作成）
  ↓
Terraform Remote State（coreの出力値をai_serviceに渡す）
  - resource_group_name, resource_group_id
  - subnet_01_id
  - 各Private DNS Zone ID
  - log_analytics_workspace_id
  - 各Function AppのPrincipal ID
  ↓
ai_service（coreのVNet情報・Private DNS Zone情報を参照してAI Foundry、AI Search、Document Intelligence、OpenAI等のPrivate Endpointを作成）
  ↓
Function Apps → AI Services（Managed Identity認証でAI Foundry、OpenAI、Document Intelligence等にアクセス）
```

**重要性**: コアインフラが停止すると全システム停止。VNet、Private DNS Zone、Log Analyticsは`ai_service`から参照される重要な共有リソース。

---

## 設計思想

### 責務範囲と境界

**このモジュールが担当**:
- ネットワーク基盤（VNet、Subnet、NSG、Private DNS Zone）
- データストレージ基盤（Storage Account、Cosmos DB、Key Vault、Container Registry）
- コンピュート基盤（App Service、Function Apps）
- Private Endpointによるネットワークセキュリティ
- ログ収集・監視基盤（Log Analytics、Event Grid、Azure Monitor）

**このモジュールが担当しない**:
- AIサービス（AI Foundry、AI Search、Document Intelligence、OpenAI等）→ `ai_service`環境
- AIサービス用のPrivate Endpoint → `ai_service`環境

**分離理由**: コアインフラ（安定性・長期運用重視）とAIサービス（頻繁な更新・モデル変更）を分離することで、影響範囲を局所化。`ai_service`の変更時に`core`への影響を最小化。

### 変更時の注意

⚠️ **`resource_group_name`変更**: Resource Group再作成 → 全リソース削除 → システム全停止  
⚠️ **`vnet_name`、`subnet_name`変更**: VNet/Subnet再作成 → Private Endpoint全削除 → ネットワーク接続不可  
⚠️ **Private DNS Zone削除**: プライベートエンドポイントの名前解決失敗 → サービス接続不可  
⚠️ **Function App名変更**: Function App再作成 → Principal ID変更 → ai_serviceのロール割り当て失効  
⚠️ **Storage Account名、Cosmos DB名変更**: リソース再作成 → データ消失  
⚠️ **Key Vault名変更**: シークレット消失 → 認証失敗  
⚠️ **出力値（outputs.tf）削除・変更**: `ai_service`のTerraform Remote State参照失敗 → デプロイ失敗

---

## ファイル構成

```
core/
├── main.tf           # リソース定義（モジュール呼び出し中心）
├── environment.tf    # 環境変数定義（subscription_id、tenant_id、環境プレフィックス等）
├── locals.tf         # ローカル変数定義（リソース名、SKU、設定値等）
├── outputs.tf        # 出力値定義（ai_serviceから参照される）
├── provider.tf       # プロバイダー設定、backend設定
└── env_vars/         # 環境固有の変数ファイル（未確認）
```

**main.tfの構造**: 
- Provider設定
- Data Sources（未使用）
- Foundation Layer（common、log_analytics、vnet、private_dns_zone）
- Data & Storage Layer（storage_account、container_registry、cosmos_db、key_vault）
- Compute Layer（app_service_plan、appservice、azure_function）
- Network Layer（private_endpoint）
- Event & Monitoring Layer（event_grid、azure_monitor）

**locals.tfの構造**: 
- 基本設定（subscription_id、tenant_id、resource_group_name、location、tags）
- 各リソースの設定値（名前、SKU、容量、診断設定等）

**outputs.tfの構造**: 
- Resource Group（resource_group_name、resource_group_id）
- Network（location、subnet_01_id）
- Private DNS Zone（9種類のPrivate DNS Zone ID）
- Log Analytics（log_analytics_workspace_id）
- Key Vault（key_vault_name、key_vault_id）
- 各Function AppのPrincipal ID

---

## 使用方法

### 初期化
```bash
cd c:\workspace\01_genashi\original-beta\infra\tenant\hisys\trial\core
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

⚠️ **重要**: `ai_service`は`core`のTerraform Remote Stateを参照するため、`core`を先にデプロイする必要があります。

---

## 入力変数

**Terraform State設定**:
- `tfstate_resource_group_name`: Terraform State用のResource Group名（デフォルト: `rgtfstate`）
- `tfstate_storage_account_name`: Terraform State用のStorage Account名（環境ごとに異なる、デフォルト: `genashitfstate002`）

**Azure認証設定**:
- `subscription_id`: Azure Subscription ID（環境ごとに異なる）
- `tenant_id`: Azure Tenant ID（環境ごとに異なる）

**リソース命名設定**:
- `environment_prefix`: リソース名プレフィックス（環境ごとに異なる、デフォルト: `98`）

**セキュリティ設定**:
- `security_group_object_id`: セキュリティグループのオブジェクトID
- `frontend_auth_client_id`: Azure ADアプリケーションのClient ID（GitHub Secretsから取得）
- `frontend_auth_client_secret`: クライアントシークレット（GitHub Secretsから取得、sensitive）

**Frontend IP制限設定**:
- `frontend_additional_ip_restrictions`: Frontend App Serviceに追加するIP制限ルール

**その他**:
- `init_flag`: 初回実行フラグ（デフォルト: `false`）

⚠️ **変更時の影響**:
- `subscription_id`、`tenant_id`変更 → 別環境へのデプロイ
- `environment_prefix`変更 → リソース名変更 → リソース再作成
- `security_group_object_id`変更 → Key Vaultアクセス権限変更

詳細は[environment.tf](environment.tf)を参照。

---

## 出力値

| 出力名 | 説明 | 使用先 |
|--------|------|--------|
| `resource_group_name` | Resource Group名 | ai_service |
| `resource_group_id` | Resource Group ID | ai_service |
| `location` | リージョン | ai_service |
| `subnet_01_id` | Subnet 01のID | ai_service（Private Endpoint作成用） |
| `private_dns_zone_cognitive_services_id` | Cognitive Services用Private DNS Zone ID | ai_service |
| `private_dns_zone_openai_id` | OpenAI用Private DNS Zone ID | ai_service |
| `private_dns_zone_search_service_id` | Search Service用Private DNS Zone ID | ai_service |
| `private_dns_zone_app_service_id` | App Service用Private DNS Zone ID | ai_service |
| `private_dns_zone_blob_id` | Blob Storage用Private DNS Zone ID | ai_service |
| `private_dns_zone_queue_id` | Queue Storage用Private DNS Zone ID | ai_service |
| `private_dns_zone_key_vault_id` | Key Vault用Private DNS Zone ID | ai_service |
| `private_dns_zone_cosmosdb_id` | Cosmos DB用Private DNS Zone ID | ai_service |
| `private_dns_zone_container_registry_id` | Container Registry用Private DNS Zone ID | ai_service |
| `log_analytics_workspace_id` | Log Analytics Workspace ID | ai_service（診断設定用） |
| `key_vault_name` | Key Vault名 | 参照用 |
| `key_vault_id` | Key Vault ID | 参照用 |
| 各Function AppのPrincipal ID | Function AppのManaged Identity Principal ID | ai_service（ロール割り当て用） |

⚠️ **重要**: これらの出力値はTerraform Remote Stateで`ai_service`から参照されます。出力値を削除・変更すると`ai_service`のデプロイが失敗します。

詳細は[outputs.tf](outputs.tf)を参照。

---

## 依存関係

### 必須依存
- **Terraform State用Storage Account**: 事前に`rgtfstate` Resource Group内に`genashitfstate002` Storage Accountが作成されている必要があります。
- **モジュール**: `../../../../modules/`配下の各モジュール（common、log_analytics、vnet、storage_account、cosmos_db、key_vault、app_service_plan、appservice、azure_function、private_endpoint、event_grid、azure_monitor、private_dns_zone）

### オプション依存
- なし（独立して実行可能）

### 依存先（このモジュールに依存）
- **ai_service環境**: Terraform Remote Stateでcoreの出力値を参照
  - `data "terraform_remote_state" "core"`でリソース情報を取得
  - VNet、Subnet、Private DNS Zone、Log Analytics、Function AppのPrincipal ID等を参照

### data source
- なし（main.tfに`data "terraform_remote_state"`の記述なし）

---

## Copilot向け注意事項

### 1. 責務を越える変更禁止
このモジュールはコアインフラのみ担当。AIサービスは`ai_service`モジュール。

### 2. `resource_group_name`、`vnet_name`、リソース名は変更禁止
名前変更 → リソース再作成 → データ消失・ネットワーク切断 → システム全停止

### 3. 出力値（outputs.tf）の削除・変更は慎重に
`ai_service`がTerraform Remote Stateで参照。出力値削除 → `ai_service`デプロイ失敗。

### 4. Private DNS Zoneは削除禁止
Private Endpoint名前解決に必須。削除 → プライベートエンドポイント接続失敗 → サービス利用不可。

### 5. Function App Principal IDの出力値は削除禁止
`ai_service`でロール割り当てに使用。削除 → ロール割り当て失敗 → Function AppからAIサービスアクセス不可。

### 6. デプロイ順序は厳守
`core` → `ai_service`の順序。逆順でデプロイするとTerraform Remote State参照失敗。

### 7. Log Analytics診断設定は削除禁止
トラブルシューティング（API呼び出しログ、エラーログ等）に必須。削除 → 障害調査不可。

---

## 動作確認観点

### 1. terraform validate
構文エラーがないことを確認。

### 2. terraform plan
- 意図しない差分がないこと
- リソース名、SKU、設定値が正しいこと
- Private DNS Zone、Private Endpointが作成されること

### 3. Azureポータル確認
- Resource Groupが作成されていること
- VNet、Subnet、NSGが正しいこと
- Private DNS ZoneがVNetにリンクされていること
- Storage Account、Cosmos DB、Key Vault、Container Registryが作成されていること
- App Service、Function Appsが作成され、Private Endpointが接続されていること
- Log Analyticsが作成され、診断設定が有効化されていること

### 4. ai_serviceからの参照確認
- Terraform Remote Stateで`core`の出力値が参照できること
- `ai_service`のデプロイが成功すること

### 5. ネットワーク接続確認
- Private Endpointが正常に動作していること
- パブリックアクセスが制限されていること

### 6. ロールバック時の確認
- `resource_group_name`変更は原則禁止（全リソース再作成でデータ消失）
- リソース名変更は慎重に（依存関係確認後のみ実行）

---

## H推部検証環境デプロイ時の注意点

### 環境概要
- **サブスクリプション**: def81dc7-dd19-48d9-a825-9aeb35274dd4（Ｈ推部_社内業務効率化検証）
- **テナントID**: f54277c9-dafe-44aa-85a4-73d5c7c52450
- **環境プレフィックス**: "hs"
- **リソースグループ**: rg-genashi-trial-hs
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
- ✅ Private Endpoint制約を常に回避（Key Vault Secrets、Event Grid、Storage Blobのデプロイエラー回避）
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

### 1. init_flag=trueでのデプロイが必須

**理由**: Private Endpoint化すると、Storage AccountやKey Vaultが外部ネットワークからアクセス不可になります。Terraformは外部から実行されるため、以下の順序でデプロイする必要があります。

**デプロイ手順**:
```bash
# Phase 1: パブリックアクセス許可（init_flag=true）
terraform plan -var="init_flag=true" -out=tfplan
terraform apply tfplan

# Phase 2（オプション）: Private Endpoint化（init_flag=false）
# ※外部Terraformからは実行不可、VNet内部からのみ実行可能
terraform plan -var="init_flag=false" -out=tfplan
terraform apply tfplan
```

**Phase 2の制約**: 
- Storage Account、Key VaultのPrivate Endpoint化後、Terraform実行環境から以下リソースがデプロイ不可：
  - Storage Blob（.keepファイル等）: 403 Forbidden
  - Key Vault Secrets（11個）: 403 ForbiddenByRbac
  - Event Grid Subscriptions（3個）: 400 Webhook検証失敗

### 2. lifecycle ignore_changesの追加

**対象モジュール**: 
- `modules/azure_function/main.tf`
- `modules/private_dns_zone/main.tf`

**追加内容**:
```hcl
lifecycle {
  ignore_changes = [
    app_settings,  # Function App（Azure自動設定の差分を無視）
    site_config[0].application_insights_connection_string,
    tags,  # Private DNS Zone（タグの自動追加を無視）
  ]
}
```

**理由**: 
- Function Appの`app_settings`はAzureが動的に管理するため、terraform plan実行時に差分として表示されます
- lifecycle ignore_changesを設定することで、実際には変更されないが表示される差分を抑制します
- これにより27個の差分が8個に削減されます（実際の変更は0）

**注意**: 
- terraform plan時には差分として表示されますが、terraform apply時には変更されません（Terraformの仕様）
- RAG比較検証で「terraform planで差分なし」を目指す場合、この差分は許容する必要があります

### 3. 一時的なパブリックアクセス許可

**必要なケース**: Private Endpoint化後にTerraformで再デプロイする場合

**手順**:
```bash
# Storage Accountのパブリックアクセス一時許可
az storage account update \
  --name stgenashitrialhs \
  --resource-group rg-genashi-trial-hs \
  --default-action Allow \
  --bypass AzureServices \
  --public-network-access Enabled

# Key Vaultのパブリックアクセス一時許可
az keyvault update \
  --name kv-genashi-trial-hs \
  --resource-group rg-genashi-trial-hs \
  --default-action Allow \
  --bypass AzureServices \
  --public-network-access Enabled

# Terraformデプロイ実行
terraform apply -var="init_flag=true" -auto-approve
```

### 4. 認証設定（検証環境用ダミー値）

**environment.tf設定**:
```hcl
variable "frontend_auth_client_id" {
  default = "00000000-0000-0000-0000-000000000000"
}

variable "frontend_auth_client_secret" {
  default = "dummy-secret-for-validation"
  sensitive = true
}
```

**理由**: 検証環境では実際のEasy Auth設定が不要なため、ダミー値で検証可能

### 5. デプロイ実績

**Phase 1（init_flag=true）デプロイ結果**:
- core: 130+リソース作成成功
- ai_service: 80リソース作成成功（gpt-5.2モデル使用）

**Phase 2（init_flag=false）デプロイ結果**:
- core: 50 network resources（VNet integration、Private Endpoints、DNS Zones）
- ai_service: 24 added, 6 changed, 20 destroyed（Private Endpoints有効化）
- 未デプロイ: 11 Key Vault Secrets + 3 Event Grid Subscriptions（Private Endpoint制約）

**差分状況（init_flag=true、lifecycle ignore_changes適用後）**:
- core: 8個の差分表示（実際の変更は0）
  - Function Apps app_settings: 5個（Managed Identity管理のため値読取不可）
  - Storage Account network_rules: 1個（手動設定との差分）
  - Private DNS Zone tags: 2個（Azure自動追加）
- ai_service: 差分なし（No changes）

### 6. トラブルシューティング

**問題**: terraform plan実行時に403 Forbidden（Storage Blob）
**原因**: Storage AccountがPrivate Endpoint化されている
**対策**: 上記「3. 一時的なパブリックアクセス許可」を実施

**問題**: Key Vault Secretsがデプロイできない（403 ForbiddenByRbac）
**原因**: Key VaultのPrivate Endpoint化により外部アクセス不可
**対策**: VNet内部のVMからTerraform実行、または手動でSecrets作成

**問題**: Event Grid Subscriptionsがデプロイできない（400 Webhook検証失敗）
**原因**: Function AppsのVNet統合により、外部からWebhook検証不可
**対策**: VNet内部からデプロイ、またはinit_flag=true状態を維持

### 7. システム工学レポート用の記録

**変更内容サマリ**:
1. environment.tf: subscription_id、tenant_id、environment_prefix（"hs"）、tfstate設定変更
2. provider.tf: backend設定変更（tfstatehsuibu001、rg-tfstate-hsuibu）
3. modules/azure_function: lifecycle ignore_changes追加
4. modules/private_dns_zone: lifecycle ignore_changes追加
5. デプロイ戦略: init_flag=trueでの段階的デプロイ採用

**学習ポイント**:
- Private Endpoint化は段階的に実施が推奨（init_flag戦略）
- Azure自動管理リソースはlifecycle ignore_changesで対応
- terraform plan差分とterraform apply実変更は異なる場合がある
- RAG比較検証では一定の差分許容が必要
