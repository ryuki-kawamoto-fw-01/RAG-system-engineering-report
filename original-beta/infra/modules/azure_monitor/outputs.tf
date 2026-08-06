output "action_group_id" {
	description = "Azure Monitor Action Group ID"
	value       = azurerm_monitor_action_group.this.id
}

output "action_group_name" {
	description = "Azure Monitor Action Group 名"
	value       = azurerm_monitor_action_group.this.name
}

output "resource_health_alert_id" {
	description = "Resource Health Scheduled Query Alert ID"
	value       = azurerm_monitor_scheduled_query_rules_alert_v2.resource_health.id
}

output "resource_health_alert_name" {
	description = "Resource Health Scheduled Query Alert 名"
	value       = azurerm_monitor_scheduled_query_rules_alert_v2.resource_health.name
}

output "service_health_alert_01_id" {
	description = "Service Health Alert 01 ID"
	value       = azurerm_monitor_activity_log_alert.service_health_01.id
}

output "service_health_alert_01_name" {
	description = "Service Health Alert 01 名"
	value       = azurerm_monitor_activity_log_alert.service_health_01.name
}

output "service_health_alert_02_id" {
	description = "Service Health Alert 02 ID"
	value       = azurerm_monitor_activity_log_alert.service_health_02.id
}

output "service_health_alert_02_name" {
	description = "Service Health Alert 02 名"
	value       = azurerm_monitor_activity_log_alert.service_health_02.name
}

output "id" {
	description = "Action Group ID（互換性のため）"
	value       = azurerm_monitor_action_group.this.id
}
