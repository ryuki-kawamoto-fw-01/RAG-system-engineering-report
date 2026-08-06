variable "resource_group_name" {
	description = "Azure Monitor リソースを配置するリソースグループ名"
	type        = string
}

variable "location" {
	description = "Azure Monitor リソースの配置リージョン"
	type        = string
}

variable "action_group_name" {
	description = "Action Group 名"
	type        = string
}

variable "action_group_short_name" {
	description = "Action Group の短縮名（12文字以内）"
	type        = string
}

variable "action_group_enabled" {
	description = "Action Group 有効化フラグ"
	type        = bool
}

variable "email_receivers" {
	description = "Action Group に設定するメール受信者"
	type = list(object({
		name                    = string
		email_address           = string
		use_common_alert_schema = bool
	}))
}

variable "resource_health_alert_name" {
	description = "Resource Health ログベースアラート名"
	type        = string
}

variable "resource_health_query" {
	description = "Resource Health の KQL クエリ"
	type        = string
}

variable "resource_health_evaluation_frequency" {
	description = "Resource Health アラート評価頻度（例: PT5M）"
	type        = string
}

variable "resource_health_window_duration" {
	description = "Resource Health アラート評価期間（例: PT5M）"
	type        = string
}

variable "resource_health_scopes" {
	description = "Resource Health アラートのスコープ ID リスト"
	type        = list(string)
}

variable "resource_health_severity" {
	description = "Resource Health アラート重大度"
	type        = number
}

variable "resource_health_enabled" {
	description = "Resource Health アラート有効化フラグ"
	type        = bool
}

variable "resource_health_auto_mitigation" {
	description = "Resource Health アラート自動復旧フラグ"
	type        = bool
}

variable "service_health_alert_01_name" {
	description = "Service Health Alert 01 名"
	type        = string
}

variable "service_health_scopes" {
	description = "Service Health Alert のスコープ ID リスト"
	type        = list(string)
}

variable "service_health_01_enabled" {
	description = "Service Health Alert 01 有効化フラグ"
	type        = bool
}

variable "service_health_01_events" {
	description = "Service Health Alert 01 監視イベント"
	type        = list(string)
}

variable "service_health_01_locations" {
	description = "Service Health Alert 01 監視ロケーション"
	type        = list(string)
}

variable "service_health_01_services" {
	description = "Service Health Alert 01 監視サービス"
	type        = list(string)
}

variable "service_health_alert_02_name" {
	description = "Service Health Alert 02 名"
	type        = string
}

variable "service_health_02_enabled" {
	description = "Service Health Alert 02 有効化フラグ"
	type        = bool
}

variable "service_health_02_events" {
	description = "Service Health Alert 02 監視イベント"
	type        = list(string)
}

variable "service_health_02_locations" {
	description = "Service Health Alert 02 監視ロケーション"
	type        = list(string)
}

variable "service_health_02_services" {
	description = "Service Health Alert 02 監視サービス"
	type        = list(string)
}

variable "tags" {
	description = "リソースタグ"
	type        = map(string)
	default     = {}
}
