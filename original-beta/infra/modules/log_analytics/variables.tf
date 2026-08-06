variable "log_name" {
  description = "Log Analytics Workspace名"
  type        = string
}

variable "location_name" {
  description = "ロケーション名"
  type        = string
}

variable "resource_group_name" {
  description = "リソースグループ名"
  type        = string
}

variable "tags" {
  description = "タグ"
  type        = map(string)
  default     = {}
}
