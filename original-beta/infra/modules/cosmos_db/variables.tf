variable "cosmosdb_account_name" {
	description = "Cosmos DB account name"
	type        = string
}

variable "location" {
	description = "Deployment region"
	type        = string
}

variable "resource_group_name" {
	description = "Resource group name"
	type        = string
}

variable "public_network_access_enabled" {
	description = "Enable public network access"
	type        = bool
	default     = false
}

variable "network_acl_bypass" {
	description = "Firewall bypass setting for Azure services"
	type        = string
	default     = "None"
}

variable "disable_local_auth" {
	description = "Disable local key-based authentication"
	type        = bool
	default     = true
}

variable "enable_automatic_failover" {
	description = "Enable automatic failover"
	type        = bool
	default     = true
}

variable "enable_multiple_write_locations" {
	description = "Enable multiple write regions"
	type        = bool
	default     = false
}

variable "failover_locations" {
	description = "Failover locations"
	type        = list(any)
	default     = []
}

variable "total_throughput_limit" {
	description = "Account-level throughput limit (RU/s)"
	type        = number
	default     = 6000
}

variable "consistency_level" {
	description = "Consistency level"
	type        = string
	default     = "BoundedStaleness"
}

variable "consistency_max_interval_in_seconds" {
	description = "Bounded staleness max interval in seconds"
	type        = number
	default     = 300
}

variable "consistency_max_staleness_prefix" {
	description = "Bounded staleness max staleness prefix"
	type        = number
	default     = 100
}

variable "backup_type" {
	description = "Backup type"
	type        = string
	default     = "Periodic"
}

variable "backup_interval_in_minutes" {
	description = "Periodic backup interval in minutes"
	type        = number
	default     = 240
}

variable "backup_retention_in_hours" {
	description = "Periodic backup retention in hours"
	type        = number
	default     = 8
}

variable "backup_storage_redundancy" {
	description = "Backup storage redundancy"
	type        = string
	default     = "Geo"
}

variable "enable_free_tier" {
	description = "Enable free tier"
	type        = bool
	default     = false
}

variable "analytical_storage_enabled" {
	description = "Enable analytical storage"
	type        = bool
	default     = false
}

variable "databases" {
	description = "Databases and containers definition"
	type        = list(any)
	default     = []
}

variable "log_analytics_workspace_id" {
	description = "Log Analytics workspace ID for diagnostics"
	type        = string
}

variable "diagnostic_setting_name" {
	description = "Diagnostic setting name"
	type        = string
}

variable "tags" {
	description = "Tags"
	type        = map(string)
	default     = {}
}
