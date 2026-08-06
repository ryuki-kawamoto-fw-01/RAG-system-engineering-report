variable "function_app_name" {
	type = string
}

variable "resource_group_name" {
	type = string
}

variable "location" {
	type = string
}

variable "service_plan_id" {
	type = string
}

variable "storage_account_name" {
	type = string
}

variable "storage_account_id" {
	type = string
}

variable "virtual_network_subnet_id" {
	type    = string
	default = null
}

variable "python_version" {
	type    = string
	default = null
}

variable "use_container_image" {
	type    = bool
	default = false
}

variable "docker_registry_url" {
	type    = string
	default = null
}

variable "docker_image_name" {
	type    = string
	default = null
}

variable "docker_image_tag" {
	type    = string
	default = "latest"
}

variable "app_settings" {
	type    = map(string)
	default = {}
}

variable "application_insights_name" {
	type = string
}

variable "log_analytics_workspace_id" {
	type = string
}

variable "diagnostic_setting_name" {
	type = string
}

variable "enable_detailed_vnet_routing" {
	type    = bool
	default = false
}

variable "init_flag" {
	type    = bool
	default = false
}

variable "use_storageaccount_queue" {
	type    = bool
	default = false
}

variable "create_acr_role_assignment" {
	type    = bool
	default = false
}

variable "container_registry_id" {
	type    = string
	default = null
}

variable "create_cosmos_db_role_assignment" {
	type    = bool
	default = false
}

variable "cosmos_db_account_id" {
	type    = string
	default = null
}

variable "public_network_access_enabled" {
	type    = bool
	default = true
}

variable "tags" {
	type    = map(string)
	default = {}
}
