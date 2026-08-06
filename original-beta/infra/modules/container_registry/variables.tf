/**
 * Container Registry Module Variables
 * Azure Container Registry の入力変数を定義する
 */

variable "container_registry_name" {
  description = "Container Registry の名前（グローバルでユニークである必要がある）"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9]{5,50}$", var.container_registry_name))
    error_message = "Container Registry 名は 5-50 文字の英数字のみで構成する必要があります。"
  }
}

variable "resource_group_name" {
  description = "リソースグループ名"
  type        = string
}

variable "location" {
  description = "リージョン"
  type        = string
}

variable "sku" {
  description = "SKU (Basic, Standard, Premium)"
  type        = string
  default     = "Standard"

  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.sku)
    error_message = "SKU は Basic, Standard, Premium のいずれかである必要があります。"
  }
}

variable "admin_enabled" {
  description = "管理者アカウントを有効化するか"
  type        = bool
  default     = false
}

variable "public_network_access_enabled" {
  description = "パブリックネットワークアクセスを有効化するか"
  type        = bool
  default     = false
}

variable "network_rule_set" {
  description = "ネットワークルール設定"
  type = object({
    default_action = string
    ip_rule = optional(list(object({
      action   = string
      ip_range = string
    })))
  })
  default = null
}

variable "georeplications" {
  description = "Geo レプリケーション設定（Premium SKU のみ）"
  type = list(object({
    location                  = string
    zone_redundancy_enabled   = optional(bool, false)
    regional_endpoint_enabled = optional(bool, false)
    tags                      = optional(map(string), {})
  }))
  default = null
}

variable "retention_policy_enabled" {
  description = "イメージ保持ポリシーを有効化するか（Premium SKU のみ）"
  type        = bool
  default     = false
}

variable "retention_policy_days" {
  description = "イメージ保持日数（Premium SKU のみ）"
  type        = number
  default     = 7
}

variable "trust_policy_enabled" {
  description = "信頼ポリシーを有効化するか（Premium SKU のみ）"
  type        = bool
  default     = false
}

variable "quarantine_policy_enabled" {
  description = "Quarantine ポリシーを有効化するか（Premium SKU のみ）"
  type        = bool
  default     = false
}

variable "zone_redundancy_enabled" {
  description = "Zone 冗長性を有効化するか（Premium SKU のみ）"
  type        = bool
  default     = false
}

variable "encryption" {
  description = "暗号化設定（Premium SKU のみ、カスタマーマネージドキー使用時）"
  type = object({
    key_vault_key_id   = string
    identity_client_id = string
  })
  default = null
}

variable "identity" {
  description = "マネージドID設定"
  type = object({
    type         = string
    identity_ids = optional(list(string))
  })
  default = null
}

variable "log_retention_days" {
  description = "ログ保持日数"
  type        = number
  default     = 30
}

variable "log_categories" {
  description = "有効化するログカテゴリ"
  type        = list(string)
  default = [
    "ContainerRegistryRepositoryEvents",
    "ContainerRegistryLoginEvents"
  ]
}

variable "tags" {
  description = "リソースタグ"
  type        = map(string)
  default     = {}
}

variable "network_ip_rules" {
  description = "ネットワークIPルール"
  type        = list(string)
  default     = []
}

variable "data_endpoint_enabled" {
  description = "データエンドポイントを有効化"
  type        = bool
  default     = false
}

variable "anonymous_pull_enabled" {
  description = "匿名プルを有効化"
  type        = bool
  default     = false
}

variable "init_flag" {
  description = "Is this my first deploy on that environment?"
  type        = bool
  default     = false
}

variable "network_default_action" {
  description = "ネットワークのデフォルトアクション"
  type        = string
  default     = "Allow"
}

variable "log_analytics_workspace_id" {
  description = "診断設定用のLog Analytics Workspace ID"
  type        = string
}

variable "diagnostic_setting_name" {
  description = "診断設定の名前"
  type        = string
}