# =============================================================================
# Private DNS Zone Module - Variables
# =============================================================================

variable "dns_zone_name" {
  description = "Private Endpointの名前解決に使用するPrivate DNS Zone名"
  type        = string
}

variable "resource_group_name" {
  description = "Private DNS Zoneを配置するResource Group名"
  type        = string
}

variable "virtual_network_ids" {
  description = "Private DNS ZoneへリンクするVNet IDの一覧"
  type        = list(string)
  default     = []
}

variable "auto_registration_enabled" {
  description = "VNet LinkでDNSレコードの自動登録を有効にするか"
  type        = bool
  default     = false
}

variable "init_flag" {
  description = "初期構築フェーズかどうか。trueではZone本体のみ作成し、falseでVNet Linkを作成する"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Private DNS ZoneおよびVNet Linkへ設定するタグ"
  type        = map(string)
  default     = {}
}
