# =============================================================================
# Storage Account Module - Variables
# =============================================================================

# -----------------------------------------------------------------------------
# 必須変数
# -----------------------------------------------------------------------------

variable "storage_account_name" {
  description = "Storage Account名（24文字以下、英数字のみ）"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9]{3,24}$", var.storage_account_name))
    error_message = "Storage Account名は3-24文字の小文字英数字のみである必要があります。"
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

# -----------------------------------------------------------------------------
# Storage Account 設定
# -----------------------------------------------------------------------------

variable "account_tier" {
  description = "Storage Accountのティア"
  type        = string
  default     = "Standard"
}

variable "account_replication_type" {
  description = "Storage Accountのレプリケーション種類"
  type        = string
  default     = "LRS"
}

variable "account_kind" {
  description = "Storage Accountの種類"
  type        = string
  default     = "StorageV2"
}

variable "access_tier" {
  description = "アクセス層（Hot/Cool）"
  type        = string
  default     = "Hot"
}

# -----------------------------------------------------------------------------
# ネットワーク設定
# -----------------------------------------------------------------------------

variable "init_flag" {
  # 呼び出し側でPhase制御済みのため本モジュール内では未使用
  description = "初期構築フラグ（呼び出し側から渡される）"
  type        = bool
  default     = false
}

variable "public_network_access_enabled" {
  description = "パブリックネットワークアクセス有効/無効（呼び出し側が制御）"
  type        = bool
}

variable "network_default_action" {
  description = "ネットワークルールのデフォルトアクション（Allow/Deny）"
  type        = string
  default     = "Allow"
}

variable "network_subnet_ids" {
  description = "アクセスを許可するサブネットIDのリスト（virtual_network_subnet_ids）"
  type        = list(string)
  default     = []
}

variable "routing_choice" {
  # default値として MicrosoftRouting を設定（呼び出し側から渡されない前提）
  description = "ネットワークルーティング選択（MicrosoftRouting/InternetRouting）"
  type        = string
  default     = "MicrosoftRouting"
}

# -----------------------------------------------------------------------------
# データ保護設定
# -----------------------------------------------------------------------------

variable "blob_soft_delete_retention_days" {
  description = "Blobの論理的な削除の保持期間（日数）"
  type        = number
  default     = 7
}

variable "container_soft_delete_retention_days" {
  description = "コンテナーの論理的な削除の保持期間（日数）"
  type        = number
  default     = 7
}

variable "file_share_soft_delete_retention_days" {
  description = "ファイル共有の論理的な削除の保持期間（日数）"
  type        = number
  default     = 7
}

# -----------------------------------------------------------------------------
# コンテナー定義
# -----------------------------------------------------------------------------

variable "containers" {
  description = "作成するBlobコンテナーの定義"
  type = list(object({
    name                  = string
    container_access_type = string
  }))
  default = []
}

# -----------------------------------------------------------------------------
# Queue 定義
# -----------------------------------------------------------------------------
# 【要確認】設計書にQueue名の記載がないため、デフォルトは空
# Private Endpoint (queue) が定義されているため、Queueは使用される想定
# 具体的なQueue名と用途を設計書で確認してください

variable "queues" {
  description = "作成するStorage Queueの名前リスト"
  type    = list(string)
  default = []
}

# -----------------------------------------------------------------------------
# フォルダプレースホルダー定義
# -----------------------------------------------------------------------------

variable "folder_placeholders" {
  description = "空Blobで表現する仮想フォルダの定義（{container_name, folder_path}）"
  type = map(object({
    container_name = string
    folder_path    = string
  }))
  default = {}
}

# -----------------------------------------------------------------------------
# 診断設定
# -----------------------------------------------------------------------------

variable "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID（診断ログの送信先）"
  type        = string
  default     = null
}

variable "enable_blob_diagnostic_setting" {
  description = "Blob Service診断設定を作成するか"
  type        = bool
  default     = true
}

variable "enable_queue_diagnostic_setting" {
  description = "Queue Service診断設定を作成するか"
  type        = bool
  default     = true
}

variable "blob_diagnostic_setting_name" {
  description = "Blob Service診断設定名（呼び出し側から指定）"
  type        = string
}

variable "queue_diagnostic_setting_name" {
  description = "Queue Service診断設定名（呼び出し側から指定）"
  type        = string
}

# -----------------------------------------------------------------------------
# タグ
# -----------------------------------------------------------------------------

variable "tags" {
  description = "リソースに付与するタグ"
  type        = map(string)
  default     = {}
}
