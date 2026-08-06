locals {
	event_subscription_common = {
		retry_policy = {
			max_delivery_attempts = 10
			event_time_to_live    = 30
		}
	}

	pdf_function_id = can(regex("/functions/", var.pdf_function_id)) ? var.pdf_function_id : "${var.pdf_function_id}/functions/${var.pdf_function_name}"
	markdown_function_id = can(regex("/functions/", var.markdown_function_id)) ? var.markdown_function_id : "${var.markdown_function_id}/functions/${var.markdown_function_name}"
	pagesplitter_function_id = can(regex("/functions/", var.pagesplitter_function_id)) ? var.pagesplitter_function_id : "${var.pagesplitter_function_id}/functions/${var.pagesplitter_function_name}"
}

resource "azurerm_eventgrid_system_topic" "system_topic" {
	name                   = var.system_topic_name
	location               = var.location
	resource_group_name    = var.resource_group_name
	source_resource_id     = var.storage_account_id
	topic_type             = "Microsoft.Storage.StorageAccounts"

	identity {
		type = "SystemAssigned"
	}

	tags                   = var.tags
}

resource "azurerm_eventgrid_system_topic_event_subscription" "pdf" {
	count = var.enable_pdf_subscription ? 1 : 0

	name                = var.pdf_subscription_name
	system_topic        = azurerm_eventgrid_system_topic.system_topic.name
	resource_group_name = var.resource_group_name

	included_event_types = var.included_event_types

	subject_filter {
		subject_begins_with = var.pdf_container_path
		subject_ends_with   = var.pdf_subject_ends_with
		case_sensitive      = false
	}

	retry_policy {
		max_delivery_attempts = local.event_subscription_common.retry_policy.max_delivery_attempts
		event_time_to_live    = local.event_subscription_common.retry_policy.event_time_to_live
	}

	azure_function_endpoint {
		function_id = local.pdf_function_id
	}

	depends_on = [azurerm_eventgrid_system_topic.system_topic]
}

resource "azurerm_eventgrid_system_topic_event_subscription" "markdown" {
	count = var.enable_markdown_subscription ? 1 : 0

	name                = var.markdown_subscription_name
	system_topic        = azurerm_eventgrid_system_topic.system_topic.name
	resource_group_name = var.resource_group_name

	included_event_types = var.included_event_types

	subject_filter {
		subject_begins_with = var.markdown_container_path
		subject_ends_with   = var.markdown_subject_ends_with
		case_sensitive      = false
	}

	retry_policy {
		max_delivery_attempts = local.event_subscription_common.retry_policy.max_delivery_attempts
		event_time_to_live    = local.event_subscription_common.retry_policy.event_time_to_live
	}

	azure_function_endpoint {
		function_id = local.markdown_function_id
	}

	depends_on = [azurerm_eventgrid_system_topic.system_topic]
}

resource "azurerm_eventgrid_system_topic_event_subscription" "pagesplitter" {
	count = var.enable_pagesplitter_subscription ? 1 : 0

	name                = var.pagesplitter_subscription_name
	system_topic        = azurerm_eventgrid_system_topic.system_topic.name
	resource_group_name = var.resource_group_name

	included_event_types = var.included_event_types

	subject_filter {
		subject_begins_with = var.pagesplitter_container_path
		subject_ends_with   = var.pagesplitter_subject_ends_with
		case_sensitive      = false
	}

	retry_policy {
		max_delivery_attempts = local.event_subscription_common.retry_policy.max_delivery_attempts
		event_time_to_live    = local.event_subscription_common.retry_policy.event_time_to_live
	}

	azure_function_endpoint {
		function_id = local.pagesplitter_function_id
	}

	depends_on = [azurerm_eventgrid_system_topic.system_topic]
}

resource "azurerm_monitor_diagnostic_setting" "eventgrid_diagnostics" {
	name                       = var.diagnostic_setting_name
	target_resource_id         = azurerm_eventgrid_system_topic.system_topic.id
	log_analytics_workspace_id = var.log_analytics_workspace_id

	enabled_log {
		category_group = "allLogs"
	}

	enabled_metric {
		category = "AllMetrics"
	}
}
