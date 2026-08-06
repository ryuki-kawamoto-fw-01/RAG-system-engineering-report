# =============================================================================
# Key Vault Module - Variables
# =============================================================================

variable "key_vault_name" {
  description = "Key Vault名（3-24文字、英数字とハイフンのみ）"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9-]{3,24}$", var.key_vault_name))
    error_message = "Key Vault名は3-24文字の英数字またはハイフンのみである必要があります。"
  }
}

variable "resource_group_name" {
  description = "リソースグループ名"
  type        = string
}

variable "location" {
  description = "デプロイ先リージョン"
  type        = string
}

variable "tenant_id" {
  description = "Azure ADテナントID"
  type        = string
}

variable "public_network_access_enabled" {
  description = "パブリックネットワークアクセス有効/無効"
  type        = bool
  default     = true
}

variable "diagnostic_setting_name" {
  description = "Key Vault診断設定名"
  type        = string
  default     = null
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID"
  type        = string
  default     = null
}

variable "init_flag" {
  description = "初回デプロイフラグ（true: 制限緩和、false: 制限強化）"
  type        = bool
  default     = false
}

variable "network_acls_bypass" {
  description = "init_flag=true時のnetwork_acls.bypass設定"
  type        = string
  default     = "AzureServices"
}

variable "network_acls_ip_rules" {
  description = "許可するIPアドレスのリスト"
  type        = list(string)
  default     = []
}

variable "network_acls_virtual_network_subnet_ids" {
  description = "init_flag=false時に許可するサブネットIDのリスト"
  type        = list(string)
  default     = []
}

variable "sku_name" {
  description = "Key VaultのSKU（standard/premium）"
  type        = string
  default     = "standard"

  validation {
    condition     = contains(["standard", "premium"], var.sku_name)
    error_message = "sku_nameは standard または premium を指定してください。"
  }
}

variable "rbac_authorization_enabled" {
  description = "RBAC認証を有効化するか（推奨）"
  type        = bool
  default     = true
}

variable "soft_delete_retention_days" {
  description = "ソフト削除保持期間（日）"
  type        = number
  default     = 7
}

variable "purge_protection_enabled" {
  description = "パージ保護を有効化するか"
  type        = bool
  default     = false
}

variable "enabled_for_deployment" {
  description = "デプロイ時利用を有効化するか"
  type        = bool
  default     = false
}

variable "enabled_for_disk_encryption" {
  description = "ディスク暗号化時利用を有効化するか"
  type        = bool
  default     = false
}

variable "enabled_for_template_deployment" {
  description = "テンプレートデプロイ時利用を有効化するか"
  type        = bool
  default     = false
}

variable "access_policies" {
  description = "Key Vault Access Policy定義（RBAC利用時は空配列を指定）"
  type = list(object({
    tenant_id               = string
    object_id               = string
    key_permissions         = optional(list(string), [])
    secret_permissions      = optional(list(string), [])
    certificate_permissions = optional(list(string), [])
    storage_permissions     = optional(list(string), [])
  }))
  default = []
}

variable "secrets" {
  description = "作成するKey Vault Secret定義"
  type = map(object({
    value        = string
    content_type = optional(string, null)
    tags         = optional(map(string), {})
  }))
  default = {}
}

variable "enable_diagnostic_setting" {
  description = "診断設定を作成するか"
  type        = bool
  default     = true
}

variable "tags" {
  description = "リソースに付与するタグ"
  type        = map(string)
  default     = {}
}
