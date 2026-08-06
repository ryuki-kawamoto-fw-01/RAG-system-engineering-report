resource "azurerm_monitor_action_group" "this" {
	name                = var.action_group_name
	resource_group_name = var.resource_group_name
	short_name          = var.action_group_short_name
	enabled             = var.action_group_enabled

	dynamic "email_receiver" {
		for_each = var.email_receivers
		content {
			name                    = email_receiver.value.name
			email_address           = email_receiver.value.email_address
			use_common_alert_schema = email_receiver.value.use_common_alert_schema
		}
	}

	tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "resource_health" {
	name                = var.resource_health_alert_name
	resource_group_name = var.resource_group_name
	location            = var.location

	scopes               = var.resource_health_scopes
	evaluation_frequency = var.resource_health_evaluation_frequency
	window_duration      = var.resource_health_window_duration
	severity             = var.resource_health_severity
	enabled              = var.resource_health_enabled
	description          = var.resource_health_alert_name

	auto_mitigation_enabled = var.resource_health_auto_mitigation

	criteria {
		query                   = var.resource_health_query
		time_aggregation_method = "Count"
		operator                = "GreaterThan"
		threshold               = 0
		resource_id_column      = "_ResourceId"

		failing_periods {
			number_of_evaluation_periods = 1
			minimum_failing_periods_to_trigger_alert = 1
		}
	}

	action {
		action_groups = [azurerm_monitor_action_group.this.id]
	}

	tags = var.tags
}

resource "azurerm_monitor_activity_log_alert" "service_health_01" {
	name                = var.service_health_alert_01_name
	resource_group_name = var.resource_group_name
	location            = "global"
	scopes              = var.service_health_scopes
	enabled             = var.service_health_01_enabled

	criteria {
		category = "ServiceHealth"

		service_health {
			events    = var.service_health_01_events
			locations = var.service_health_01_locations
			services  = var.service_health_01_services
		}
	}

	action {
		action_group_id = azurerm_monitor_action_group.this.id
	}

	tags = var.tags
}

resource "azurerm_monitor_activity_log_alert" "service_health_02" {
	name                = var.service_health_alert_02_name
	resource_group_name = var.resource_group_name
	location            = "global"
	scopes              = var.service_health_scopes
	enabled             = var.service_health_02_enabled

	criteria {
		category = "ServiceHealth"

		service_health {
			events    = var.service_health_02_events
			locations = var.service_health_02_locations
			services  = var.service_health_02_services
		}
	}

	action {
		action_group_id = azurerm_monitor_action_group.this.id
	}

	tags = var.tags
}
