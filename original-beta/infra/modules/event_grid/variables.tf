variable "resource_group_name" {
	type = string
}

variable "location" {
	type = string
}

variable "system_topic_name" {
	type = string
}

variable "storage_account_id" {
	type = string
}

variable "included_event_types" {
	type = list(string)
}

variable "enable_pdf_subscription" {
	type = bool
}

variable "pdf_subscription_name" {
	type = string
}

variable "pdf_function_id" {
	type = string
}

variable "pdf_function_name" {
	type = string
}

variable "pdf_container_path" {
	type = string
}

variable "pdf_subject_ends_with" {
	type    = string
	default = ""
}

variable "enable_markdown_subscription" {
	type = bool
}

variable "markdown_subscription_name" {
	type = string
}

variable "markdown_function_id" {
	type = string
}

variable "markdown_function_name" {
	type = string
}

variable "markdown_container_path" {
	type = string
}

variable "markdown_subject_ends_with" {
	type    = string
	default = ""
}

variable "enable_pagesplitter_subscription" {
	type = bool
}

variable "pagesplitter_subscription_name" {
	type = string
}

variable "pagesplitter_function_id" {
	type = string
}

variable "pagesplitter_function_name" {
	type = string
}

variable "pagesplitter_container_path" {
	type = string
}

variable "pagesplitter_subject_ends_with" {
	type    = string
	default = ""
}

variable "diagnostic_setting_name" {
	type = string
}

variable "log_analytics_workspace_id" {
	type = string
}

variable "tags" {
	type = map(string)
}
