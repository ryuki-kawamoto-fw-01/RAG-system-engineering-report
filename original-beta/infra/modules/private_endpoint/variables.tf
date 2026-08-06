# =============================================================================
# Private Endpoint Module - Variables
# =============================================================================

# -----------------------------------------------------------------------------
# 基本設定
# -----------------------------------------------------------------------------

variable "private_endpoint_name" {
  description = "Private Endpointの名前 (例: pep-stgenashitrialhs-blob)"
  type        = string
}

variable "location" {
  description = "リソースの配置リージョン"
  type        = string
}

variable "resource_group_name" {
  description = "リソースグループ名"
  type        = string
}

variable "subnet_id" {
  description = "Private Endpointを配置するサブネットID (subnet_01)"
  type        = string
}

# -----------------------------------------------------------------------------
# Private Service Connection設定
# -----------------------------------------------------------------------------

variable "connection_name" {
  description = "Private Service Connection名 (例: blob, registry, vault)"
  type        = string
}

variable "target_resource_id" {
  description = "接続対象リソースのID"
  type        = string
}

variable "subresource_names" {
  description = "サブリソース名のリスト (例: [\"blob\"], [\"queue\"], [\"registry\"], [\"Sql\"], [\"vault\"], [\"sites\"])"
  type        = list(string)
}

# -----------------------------------------------------------------------------
# Private DNS Zone Group設定
# -----------------------------------------------------------------------------

variable "dns_zone_group_name" {
  description = "Private DNS Zone Group名 (例: blob, registry, vault)"
  type        = string
}

variable "private_dns_zone_ids" {
  description = "Private DNS ZoneのIDリスト"
  type        = list(string)
}

variable "custom_network_interface_name" {
  description = "カスタムネットワークインターフェース名（オプション）"
  type        = string
  default     = null
}

# Private DNS Zone Group Variables
variable "enable_private_dns_zone_group" {
  description = "プライベートDNSゾーングループを有効にするかどうか"
  type        = bool
  default     = true
}
# -----------------------------------------------------------------------------
# タグ
# -----------------------------------------------------------------------------

variable "tags" {
  description = "リソースに付与するタグ"
  type        = map(string)
  default     = {}
}
