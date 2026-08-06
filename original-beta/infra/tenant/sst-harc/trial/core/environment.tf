# =============================================================================
# Environment Configuration - sst-harc/trial/core
# =============================================================================
# Terraform Variables
#
# 構成順
#  1. Terraform State
#  2. Azure Authentication
#  3. Environment
#  4. Naming
#  5. Security / Authentication
#  6. Tags
#  7. Region
#  8. Networking
#  9. Storage
# 10. Log Analytics
# 11. Cosmos DB
# 12. Key Vault
# 13. App Service
# 14. Existing Resource References
# =============================================================================

# =============================================================================
# 1. Terraform State
# =============================================================================

variable "tfstate_resource_group_name" {
  description = "Terraform state用のリソースグループ名"
  type        = string
  default     = "rg-tfstate-hsuibu"
}

variable "tfstate_storage_account_name" {
  description = "Terraform state用のストレージアカウント名"
  type        = string
  default     = "tfstatehsuibu2026"
}

# 初回構築フラグ（true: 初回構築、false: セキュリティ強化後）
variable "init_flag" {
  description = "初回構築フラグ（true: 初回構築、false: セキュリティ強化後）"
  type        = bool
  default     = false
}
# =============================================================================
# 2. Azure Authentication
# =============================================================================

# Azure認証情報（環境固有の値を設定）
variable "subscription_id" {
  description = "AzureサブスクリプションID（sst-harc trial環境）"
  type        = string
  default     = "fc5afe0a-4c05-4de0-b2c5-b4276556e4de" # ← 実際のサブスクリプションIDに変更してください
  # P5190-Spoke用: "P5190-Spoke-Subscription001" の実際のGUID値を設定
  sensitive = true
}

variable "tenant_id" {
  description = "Azure ADテナントID（sst-harc trial環境）"
  type        = string
  default     = "c93188ef-5973-4094-9e16-394f977029fc" # ← 実際のテナントIDに変更してください
  sensitive   = true
}

# =============================================================================
# 3. Environment
# =============================================================================

# 環境情報
variable "environment" {
  description = "環境名 (trial, dev, staging, prod)"
  type        = string
  default     = "trial"
}

variable "tenant_name" {
  description = "テナント名"
  type        = string
  default     = "sst-harc"
}

variable "project_name" {
  description = "プロジェクト名"
  type        = string
  default     = "genashi"
}

# =============================================================================
# 4. Naming
# =============================================================================

# リソース命名設定
variable "environment_prefix" {
  description = "リソース名に使用するプレフィックス（環境ごとに異なる）"
  type        = string
  default     = "hs"
}

# =============================================================================
# 5. Security / Authentication
# =============================================================================

# セキュリティグループ設定,事前設定した値を入力
variable "security_group_object_id" {
  description = "セキュリティグループのオブジェクトID"
  type        = string
  default     = "6d6e36ae-6587-4739-8d9f-b5c1955d4cd0"
}

# Frontend 認証設定
variable "frontend_auth_client_id" {
  description = "事前登録されたAzure ADアプリケーションのClient ID"
  type        = string
  default     = "8c201204-4afc-4e00-849b-97063a8e347f"
}

variable "frontend_auth_client_secret" {
  description = "Frontend認証用Client Secret"
  type        = string
  sensitive   = true
  default     = "efc42adf-87bc-4f4c-9b82-e7689297727c"
}

# Frontend IP制限設定
variable "frontend_additional_ip_restrictions" {
  description = "Frontend App Serviceに追加するIP制限ルール"
  type = list(object({
    name       = string
    ip_address = string
    priority   = number
    action     = string
  }))
  default = []
}

# =============================================================================
# 6. Tags(使わないかもしれない)
# =============================================================================

# タグ設定
variable "common_tags" {
  description = "全リソースに付与する共通タグ"
  type        = map(string)
  default = {
    Environment = "trial"
    Tenant      = "sst-harc"
    Project     = "genashi"
    ManagedBy   = "Terraform"
    State       = "core"
  }
}

# =============================================================================
# 7. Region
# =============================================================================

# リージョン設定
variable "location" {
  description = "デプロイ先リージョン（メインリソース用）"
  type        = string
  default     = "japaneast"
}

variable "location_log_analytics" {
  description = "Log Analytics Workspaceのデプロイ先リージョン"
  type        = string
  default     = "japanwest"
}

# =============================================================================
# 8. Networking
# =============================================================================

# ネットワーク設定
variable "vnet_address_space" {
  description = "VNetのアドレス空間"
  type        = list(string)
  default     = ["10.173.8.0/23"] # P5190-Spoke VNet アドレス空間
}

variable "subnet_definitions" {
  description = "サブネット定義"
  type = map(object({
    address_prefix                                = string
    service_endpoints                             = optional(list(string), [])
    private_endpoint_network_policies_enabled     = optional(bool, false)
    private_link_service_network_policies_enabled = optional(bool, true)
    delegation = optional(object({
      name = string
      service_delegation = object({
        name    = string
        actions = list(string)
      })
    }))
  }))
  default = {
    # snet-genashi-trial-01: Private Endpoint専用サブネット
    "P5190-Spoke-PrivateSubnet001" = {
      address_prefix                            = "10.173.8.64/26" # 10.173.8.64 ～ 10.173.8.127
      service_endpoints                         = []               # サービスエンドポイント: なし
      private_endpoint_network_policies_enabled = true             # ネットワークセキュリティグループを有効化
      delegation                                = null             # サブネット委任: なし
    }
    # snet-genashi-trial-02: Function App / Web Apps専用サブネット
    "P5190-Spoke-PrivateSubnet002" = {
      address_prefix                            = "10.173.8.128/26" # 10.173.8.128 ～ 10.173.8.191
      service_endpoints                         = []                # サービスエンドポイント: なし
      private_endpoint_network_policies_enabled = true              # ネットワークセキュリティグループを有効化
      delegation = {
        name = "delegation-webapp"
        service_delegation = {
          name    = "Microsoft.Web/serverFarms"
          actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
        }
      }
    }
    # snet-genashi-trial-03: 汎用サブネット
    "P5190-Spoke-PrivateSubnet003" = {
      address_prefix                            = "10.173.9.0/25" # 10.173.9.0 ～ 10.173.9.127
      service_endpoints                         = []              # サービスエンドポイント: なし
      private_endpoint_network_policies_enabled = true            # ネットワークセキュリティグループを有効化
      delegation                                = null            # サブネット委任: なし
    }
  }
}



# =============================================================================
# 9. Storage
# =============================================================================

# Storage Account設定
variable "storage_account_tier" {
  description = "Storage Accountのティア"
  type        = string
  default     = "Standard"
}

variable "storage_account_replication" {
  description = "Storage Accountのレプリケーション種類"
  type        = string
  default     = "LRS"
}

variable "storage_account_allowed_ip_addresses" {
  description = "Storage Accountへのアクセスを許可するIPアドレスまたはCIDRブロックのリスト（HISYSプロキシ等）"
  type        = list(string)
  default     = [] # 実際の許可IPアドレスを設定してください
}

# =============================================================================
# 10. Log Analytics
# =============================================================================

# Log Analytics設定
variable "log_retention_days" {
  description = "ログ保持期間（日数）"
  type        = number
  default     = 30
}

# =============================================================================
# 11. Cosmos DB
# =============================================================================

# Cosmos DB設定
variable "cosmosdb_consistency_level" {
  description = "Cosmos DBの一貫性レベル"
  type        = string
  default     = "Session"
}

variable "cosmosdb_max_throughput" {
  description = "Cosmos DBの最大スループット（RU/s）"
  type        = number
  default     = 4000
}

# =============================================================================
# 12. Key Vault
# =============================================================================

# Key Vault設定
variable "key_vault_sku" {
  description = "Key VaultのSKU"
  type        = string
  default     = "standard"
}

# =============================================================================
# 13. App Service
# =============================================================================

# App Service設定
variable "app_service_sku_name" {
  description = "App ServiceのSKU名"
  type        = string
  default     = "P3v3"
}

# Function App設定
variable "function_app_sku_name" {
  description = "Function AppのSKU名"
  type        = string
  default     = "EP1"
}

# =============================================================================
# Frontend App Service 環境変数設定
# =============================================================================
# 参照: 【げんあし】製品化_App Service_別紙 環境変数_v1.0_20250520
# 
# セキュリティ: 機密情報は直接記載せず、Key Vault参照を使用してください
# Key Vault参照形式: @Microsoft.KeyVault(SecretUri=https://<vault-name>.vault.azure.net/secrets/<secret-name>/)

variable "frontend_app_settings" {
  description = "Frontend App Service の環境変数（非機密情報のみ）"
  type        = map(string)
  default = {
    # Node.js / Platform設定
    "WEBSITE_NODE_DEFAULT_VERSION"   = "~22"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"

    # NOTE: 以下の環境変数は実際の値または Key Vault 参照に置き換えてください
    # 例: "API_ENDPOINT" = "https://api.example.com"
  }
}

# =============================================================================
# Load Balancer App Service 環境変数設定
# =============================================================================

variable "lb_app_settings" {
  description = "Load Balancer App Service の環境変数（非機密情報のみ）"
  type        = map(string)
  default = {
    # .NET / Platform設定
    "ASPNETCORE_ENVIRONMENT"   = "Production"
    "WEBSITE_RUN_FROM_PACKAGE" = "1"
  }
}

# =============================================================================
# 14. Existing Resource References
# =============================================================================

# 既存リソース参照（Private Endpoint 用）
variable "existing_vnet_name" {
  description = "既存 VNet 名（Private Endpoint接続先）"
  type        = string
  default     = "P5190-Spoke-VNET001"
}

variable "existing_subnet_name" {
  description = "既存サブネット名（Private Endpoint配置先）"
  type        = string
  default     = "P5190-Spoke-PrivateSubnet001"
}

variable "existing_vnet_resource_group" {
  description = "既存 VNet のリソースグループ"
  type        = string
  default     = "P5190-Spoke-Rg001"
}

variable "existing_dns_zone_name" {
  description = "既存 Private DNS Zone 名（ACR用）"
  type        = string
  default     = "privatelink.azurecr.io"
}

variable "existing_dns_zone_resource_group" {
  description = "既存 Private DNS Zone のリソースグループ"
  type        = string
  default     = "P5190-Spoke-Rg001"
}

variable "existing_dns_zone_blob_name" {
  description = "既存 Private DNS Zone 名（Blob用）"
  type        = string
  default     = "privatelink.blob.core.windows.net"
}

variable "existing_dns_zone_queue_name" {
  description = "既存 Private DNS Zone 名（Queue用）"
  type        = string
  default     = "privatelink.queue.core.windows.net"
}