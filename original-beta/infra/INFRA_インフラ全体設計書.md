# Terraformインフラストラクチャ デプロイメントガイド

このディレクトリには、Azureリソースを構成・デプロイするためのTerraformコードが含まれています。

## ディレクトリ構造

```
infra/
├── README.md                      # このファイル
├── modules/                       # 再利用可能なTerraformモジュール
│   ├── ai_foundry/               # Azure AI Foundry
│   ├── ai_search/                # Azure AI Search
│   ├── app_service/              # App Service (Frontend/LoadBalancer)
│   ├── azure_function/           # Azure Functions
│   ├── azure_monitor/            # Azure Monitor
│   ├── azure_open_ai/            # Azure OpenAI
│   ├── common/                   # Resource Group等の共通リソース
│   ├── container_registry/       # Azure Container Registry
│   ├── cosmos_db/                # Cosmos DB
│   ├── document_intelligence/    # Document Intelligence
│   ├── event_grid/               # Event Grid
│   ├── key_vault/                # Key Vault
│   ├── log_analytics/            # Log Analytics Workspace
│   ├── microsoft_Foundry_language/ # Language Service
│   ├── private_dns_zone/         # Private DNS Zone
│   ├── private_endpoint/         # Private Endpoint
│   ├── private_link/             # Private Link
│   ├── storage_account/          # Storage Account
│   └── vnet/                     # Virtual Network
├── scripts/                       # デプロイメント用スクリプト
└── tenant/                        # テナント/環境別設定
    └── hisys/
        ├── dev/                   # 開発環境 (未実装)
        ├── staging/               # ステージング環境 (未実装)
        ├── prod/                  # 本番環境 (未実装)
        └── trial/                 # トライアル環境 (実装済み)
            ├── core/              # コアインフラストラクチャ
            │   ├── main.tf
            │   ├── provider.tf
            │   ├── outputs.tf
            │   ├── locals.tf
            │   └── environment.tf
            └── ai_service/        # AIサービス
                ├── main.tf
                ├── provider.tf
                ├── outputs.tf
                ├── locals.tf
                └── environment.tf
```

## モジュール一覧

| モジュール | 役割（一文要約） |
|-----------|----------------|
| **common** | リソースグループを作成する |
| **log_analytics** | Log Analytics Workspaceを作成し、全リソースの診断ログを集約する |
| **vnet** | VNet・サブネット・NSGを作成し、閉域ネットワークを構築する |
| **private_dns_zone** | Private DNS Zoneを作成し、Private Endpoint用の名前解決を提供する |
| **storage_account** | Storage Accountを作成し、ドキュメント・Function App用データを保管する |
| **container_registry** | Azure Container Registryを作成し、コンテナイメージを管理する |
| **cosmos_db** | Cosmos DBを作成し、メタデータ・履歴データを永続化する |
| **key_vault** | Key Vaultを作成し、シークレット・証明書を集中管理する |
| **app_service** | App Service（Frontend/LoadBalancer）を作成し、WebアプリとAPI振り分けを提供する |
| **azure_function** | Azure Functionsを作成し、サーバーレスバックエンド処理を実行する |
| **private_endpoint** | Private Endpointを作成し、Azureサービスへの閉域接続を確立する |
| **private_link** | Private Link Serviceを作成し、サービス間プライベート接続を構成する |
| **event_grid** | Event Gridを作成し、Blob追加などのイベント駆動処理を実現する |
| **azure_monitor** | Azure Monitorアラートを作成し、メトリクス監視・通知を設定する |
| **azure_open_ai** | Azure OpenAIを作成し、GPTモデル・埋め込みモデルをデプロイする |
| **ai_search** | Azure AI Searchを作成し、ベクトル・ハイブリッド検索を提供する |
| **document_intelligence** | Document Intelligenceを作成し、PDF/WordのOCR・構造化解析を実行する |
| **microsoft_Foundry_language** | Language Serviceを作成し、自然言語処理（NER等）を提供する |
| **ai_foundry** | Azure AI Foundryを作成し、AIモデル・実験を統合管理する |

---

## core / ai_service の役割

| ステート | 役割（一文要約） |
|---------|----------------|
| **core** | ネットワーク・ストレージ・認証基盤・アプリケーション層を構築する（安定基盤） |
| **ai_service** | AI関連サービス（OpenAI/Search/Document Intelligence）を構築する（変更頻度高） |

**ステート分離の理由**: AI実験・調整がコア基盤に影響しない。coreが先にデプロイされai_serviceから参照される。

---

## Terraformファイルの役割

各ステートディレクトリ（core/ai_service）内の標準ファイル：

| ファイル | 役割（一文要約） |
|---------|----------------|
| **main.tf** | 作成するAzureリソース（モジュール呼び出し）を定義する |
| **provider.tf** | Azureプロバイダーとリモートステート（tfstate保存先）を設定する |
| **outputs.tf** | 他のステートから参照可能な値（リソースID等）を公開する |
| **locals.tf** | 繰り返し使う計算値（リソース名・タグ・IPリスト等）を定義する |
| **environment.tf** | 環境別の変数（subscription/tenant/tfstate設定）を定義する |

---

## アーキテクチャ概要

### ステート分離戦略

インフラストラクチャは2つの独立したTerraformステートに分離されています：

1. **core** - コアインフラストラクチャ
   - Resource Group
   - Log Analytics Workspace
   - Virtual Network (VNet, Subnet, NSG)
   - Private DNS Zone
   - Storage Account
   - Container Registry
   - Cosmos DB
   - Key Vault
   - App Service (Frontend, LoadBalancer)
   - Azure Functions (全種類)
   - Private Endpoints
   - Event Grid
   - Azure Monitor

2. **ai_service** - AIサービス
   - Azure AI Foundry
   - Azure AI Search
   - Document Intelligence
   - Language Service
   - Azure OpenAI
   - AI関連Private Endpoints

**理由**: FunctionのManaged Identityの構築順の制約により、初回はパブリックアクセスを有効化する必要があるため、2段階でのapplyが必要です。また、ステート分離により、AIサービスの変更がコアインフラに影響を与えないようにしています。

---


## 必要な事前準備

### 前提条件

- Azure CLI がインストールされていること
- Terraform 1.14.3 がインストールされていること
- 適切なAzureサブスクリプションへのアクセス権限

### 1. Azureへのログイン

```powershell
az login
az account show --query "{subscriptionId: id, tenantId: tenantId}" --output table
```

### 2. ステート用のストレージアカウントの作成

Terraformのリモートステートを保存するためのストレージアカウントを作成します。

**PowerShellで実行:**

```powershell
# 環境変数を設定（ハンズオン環境用）
$env:RG_TF_NAME         = "rgtfstate"
$env:STORAGE_TF_ACCOUNT = "genashitfstate001"  # グローバルに一意な名前が必要
$env:STORAGE_TF_CONTAINER = "tfstate"

# リソースグループの作成
az group create `
  --name     $env:RG_TF_NAME `
  --location japanwest

# ストレージアカウントの作成
az storage account create `
  --name                     $env:STORAGE_TF_ACCOUNT `
  --resource-group           $env:RG_TF_NAME `
  --location                 japanwest `
  --sku                      Standard_LRS `
  --enable-hierarchical-namespace true

# コンテナの作成
az storage container create `
  --name         $env:STORAGE_TF_CONTAINER `
  --account-name $env:STORAGE_TF_ACCOUNT
```

### 3. 設定ファイルの更新

作成したストレージアカウント情報とAzureの認証情報を、以下のファイルに反映してください。

#### 3-1. subscription IDとtenant IDの確認

```powershell
az account show --query "{subscriptionId: id, tenantId: tenantId}" --output table
```

#### 3-2. environment.tfの設定

以下のファイルで、使用する環境に応じてコメントを切り替えてください：
- `infra/tenant/hisys/trial/core/environment.tf`
- `infra/tenant/hisys/trial/ai_service/environment.tf`

**ハンズオン環境の場合（デフォルト）:**
```hcl
variable "tfstate_resource_group_name" {
  default = "rgtfstate"  # ハンズオン環境
}

variable "tfstate_storage_account_name" {
  default = "genashitfstate001"  # ハンズオン環境
}

variable "subscription_id" {
  default = "f6ad11c0-2675-4843-a3b5-2ab3972292ac"  # ハンズオン環境
}

variable "tenant_id" {
  default = "b2446844-a288-4123-8fd1-965077a3860e"  # ハンズオン環境
}
```

**H推部検証環境の場合:**
```hcl
variable "tfstate_resource_group_name" {
  # default = "rgtfstate"  # ハンズオン環境
  default = "genashi_tfstate_RG"  # H推部検証環境
}

variable "tfstate_storage_account_name" {
  # default = "genashitfstate001"  # ハンズオン環境
  default = "genashitfstatest"  # H推部検証環境
}

variable "subscription_id" {
  # default = "f6ad11c0-2675-4843-a3b5-2ab3972292ac"  # ハンズオン環境
  default = "fc5afe0a-4c05-4de0-b2c5-b4276556e4de"  # H推部検証環境
}

variable "tenant_id" {
  # default = "b2446844-a288-4123-8fd1-965077a3860e"  # ハンズオン環境
  default = "c93188ef-5973-4094-9e16-394f977029fc"  # H推部検証環境
}
```

**注意**: 独自の環境を構築する場合は、上記のsubscription_idとtenant_idを、手順3-1で確認した値に置き換えてください。

#### 3-3. provider.tfの設定

以下のファイルで、使用する環境に応じてコメントを切り替えてください：
- `infra/tenant/hisys/trial/core/provider.tf`
- `infra/tenant/hisys/trial/ai_service/provider.tf`

**ハンズオン環境の場合（デフォルト）:**
```hcl
backend "azurerm" {
  resource_group_name  = "rgtfstate"           # ハンズオン環境
  storage_account_name = "genashitfstate001"   # ハンズオン環境
  container_name       = "tfstate"
  key                  = "core/terraform.tfstate"  # coreの場合
  # key                = "ai_service/terraform.tfstate"  # ai_serviceの場合
}
```

**H推部検証環境の場合:**
```hcl
backend "azurerm" {
  # resource_group_name  = "rgtfstate"           # ハンズオン環境
  resource_group_name    = "genashi_tfstate_RG"   # H推部検証環境
  # storage_account_name = "genashitfstate001"   # ハンズオン環境
  storage_account_name   = "genashitfstatest"     # H推部検証環境
  container_name         = "tfstate"
  key                    = "core/terraform.tfstate"  # coreの場合
  # key                  = "ai_service/terraform.tfstate"  # ai_serviceの場合
}
```

---

## デプロイ手順

### 重要: デプロイ順序

**必ずcoreを先にデプロイしてください。** ai_serviceはcoreのステートファイルを参照するため、coreが先にデプロイされている必要があります。

### 初回デプロイ（ハンズオン環境）

#### ステップ1: coreのデプロイ

```powershell
cd ./infra/tenant/hisys/trial/core

# Terraformの初期化
terraform init

# 初回デプロイ（パブリックアクセスを一時的に有効化）
terraform plan -var init_flag=true
terraform apply -var init_flag=true --parallelism=1

# 2回目のデプロイ（プライベートエンドポイントに切り替え）
terraform plan
terraform apply
```

**注意**: `--parallelism=1` オプションは、Managed Identityの作成順序を制御するために使用しています。

#### ステップ2: ai_serviceのデプロイ

```powershell
cd ../ai_service

# Terraformの初期化
terraform init

# 初回デプロイ（パブリックアクセスを一時的に有効化）
terraform plan -var init_flag=true
terraform apply -var init_flag=true --parallelism=1

# 2回目のデプロイ（プライベートエンドポイントに切り替え）
terraform plan
terraform apply
```

### 2回目以降のデプロイ

既にリソースがデプロイされている場合は、`init_flag`なしでデプロイできます：

```powershell
# coreの更新
cd ./infra/tenant/hisys/trial/core
terraform plan
terraform apply

# ai_serviceの更新
cd ../ai_service
terraform plan
terraform apply
```

### リソースの削除

```powershell
# 逆順で削除
cd ./infra/tenant/hisys/trial/ai_service
terraform destroy

cd ../core
terraform destroy
```

---

## coreのリソースをai_serviceから参照する方法

ai_serviceからcoreのリソースを参照する場合は、`terraform_remote_state`データソースを使用します。

### 参照可能なcoreのoutputs

以下の主要な値が参照可能です（[core/outputs.tf](tenant/hisys/trial/core/outputs.tf)で定義）:

| Output名 | 説明 |
|---------|------|
| `resource_group_name` | リソースグループ名 |
| `resource_group_id` | リソースグループID |
| `location` | ロケーション（japanwest） |
| `subnet_01_id` | Private Subnet 001のID |
| `private_dns_zone_id` | Private DNS ZoneのID |
| `log_analytics_workspace_id` | Log Analytics WorkspaceのID |
| `key_vault_name` | Key Vault名 |
| `key_vault_id` | Key VaultのリソースID |
| `frontend_app_service_name` | Frontend App Service名 |
| `frontend_app_service_id` | Frontend App ServiceのリソースID |
| `frontend_app_service_default_hostname` | Frontend App Serviceのホスト名 |
| `loadbalancer_app_service_identity_principal_id` | LoadBalancer App ServiceのManaged Identity |
| `cosmosdb_id` | Cosmos DBのリソースID |
| `storage_account_id` | Storage AccountのリソースID |
| `function_*_principal_id` | 各Function AppのManaged Identity Principal ID |

### 使用例

```hcl
# ai_service/main.tf

# coreのステートを参照
data "terraform_remote_state" "core" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rgtfstate"           # ハンズオン環境
    storage_account_name = "genashitfstate001"   # ハンズオン環境
    container_name       = "tfstate"
    key                  = "core/terraform.tfstate"
  }
}

# coreのリソースを使用
module "example_ai_service" {
  source = "../../../../modules/example"

  resource_group_name = data.terraform_remote_state.core.outputs.resource_group_name
  location            = data.terraform_remote_state.core.outputs.location
  subnet_id           = data.terraform_remote_state.core.outputs.subnet_01_id
  private_dns_zone_id = data.terraform_remote_state.core.outputs.private_dns_zone_id
  
  # Function AppのManaged Identityを使用した権限設定
  function_principal_ids = [
    data.terraform_remote_state.core.outputs.function_mfg_principal_id,
    data.terraform_remote_state.core.outputs.function_agent_rag_principal_id
  ]
}
```

### 新しいoutputをcoreに追加する場合

ai_serviceから新たなcoreのリソースを参照する必要がある場合は、以下の手順で追加してください：

1. [core/outputs.tf](tenant/hisys/trial/core/outputs.tf)に新しいoutputを追加

```hcl
# core/outputs.tf に追加例
output "example_resource_id" {
  description = "The ID of example resource"
  value       = module.example.resource_id
}
```

2. coreで`terraform apply`を実行してステートを更新
3. ai_serviceから新しいoutputを参照可能になります

---

## 環境の切り替え

### ハンズオン環境とH推部検証環境の切り替え

環境を切り替える場合は、以下の2つのファイルでコメントを切り替える必要があります：

#### 1. environment.tf
- `infra/tenant/hisys/trial/core/environment.tf`
- `infra/tenant/hisys/trial/ai_service/environment.tf`

各変数のdefault値をコメントアウト/解除して切り替えます。

**ハンズオン環境:**
```hcl
variable "tfstate_resource_group_name" {
  default = "rgtfstate"  # ハンズオン環境
  # default = "genashi_tfstate_RG"  # H推部検証環境
}

variable "tfstate_storage_account_name" {
  default = "genashitfstate001"  # ハンズオン環境
  # default = "genashitfstatest"  # H推部検証環境
}

variable "subscription_id" {
  default = "f6ad11c0-2675-4843-a3b5-2ab3972292ac"  # ハンズオン環境
  # default = "fc5afe0a-4c05-4de0-b2c5-b4276556e4de"  # H推部検証環境
}

variable "tenant_id" {
  default = "b2446844-a288-4123-8fd1-965077a3860e"  # ハンズオン環境
  # default = "c93188ef-5973-4094-9e16-394f977029fc"  # H推部検証環境
}
```

#### 2. provider.tf
- `infra/tenant/hisys/trial/core/provider.tf`
- `infra/tenant/hisys/trial/ai_service/provider.tf`

backend "azurerm"ブロック内の設定を切り替えます。

**ハンズオン環境:**
```hcl
backend "azurerm" {
  resource_group_name  = "rgtfstate"           # ハンズオン環境
  # resource_group_name  = "genashi_tfstate_RG"  # H推部検証環境
  storage_account_name = "genashitfstate001"   # ハンズオン環境
  # storage_account_name = "genashitfstatest"    # H推部検証環境
  container_name       = "tfstate"
  key                  = "core/terraform.tfstate"  # または "ai_service/terraform.tfstate"
}
```

**H推部検証環境:**
```hcl
backend "azurerm" {
  # resource_group_name  = "rgtfstate"             # ハンズオン環境
  resource_group_name    = "genashi_tfstate_RG"     # H推部検証環境
  # storage_account_name = "genashitfstate001"     # ハンズオン環境
  storage_account_name   = "genashitfstatest"       # H推部検証環境
  container_name         = "tfstate"
  key                    = "core/terraform.tfstate"  # または "ai_service/terraform.tfstate"
}
```

#### 3. ai_serviceのmain.tf

さらに、`infra/tenant/hisys/trial/ai_service/main.tf`内のdata "terraform_remote_state"ブロックも環境に合わせて切り替えてください。

**ハンズオン環境:**
```hcl
data "terraform_remote_state" "core" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rgtfstate"           # ハンズオン環境
    storage_account_name = "genashitfstate001"   # ハンズオン環境
    container_name       = "tfstate"
    key                  = "core/terraform.tfstate"
  }
}
```

**H推部検証環境:**
```hcl
data "terraform_remote_state" "core" {
  backend = "azurerm"
  config = {
    resource_group_name  = "genashi_tfstate_RG"  # H推部検証環境
    storage_account_name = "genashitfstatest"    # H推部検証環境
    container_name       = "tfstate"
    key                  = "core/terraform.tfstate"
  }
}
```

**重要**: 環境を切り替えた後は、`terraform init -reconfigure`を実行してバックエンドの設定を再初期化してください。

---

## トラブルシューティング

### Managed Identityのエラー

初回デプロイ時にManaged Identity関連のエラーが発生した場合：
- `--parallelism=1`オプションを使用してリソースの作成順序を制御
- 2回に分けてデプロイ（init_flag=true、その後通常デプロイ）

### ステートのロック

別のユーザーや処理がステートをロックしている場合：
```powershell
# ロックの確認
az storage blob list --account-name <storage_account> --container-name tfstate

# 必要に応じて強制的にロックを解除（注意して使用）
terraform force-unlock <LOCK_ID>
```

### Private Endpointの接続エラー

Private Endpoint作成後、接続が確立されない場合：
- Private DNS Zoneの設定を確認
- VNetリンクが正しく設定されているか確認
- NSGで必要なポートが許可されているか確認

---

## バージョン情報

- **Terraform**: 1.14.3
- **Azure Provider (azurerm)**: ~>4.56.0
- **Azure API Provider (azapi)**: ~>2.0

---

## 参考資料

- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Private Endpoint](https://learn.microsoft.com/azure/private-link/private-endpoint-overview)
- [Terraform Remote State](https://developer.hashicorp.com/terraform/language/state/remote)