output "app_service_plan_id" {
	description = "Frontend / LoadBalancer 用 App Service Plan ID"
	value       = azurerm_service_plan.app_service.id
}

output "service_plan_01_id" {
	description = "Frontend / LoadBalancer 用 App Service Plan ID（互換性のため）"
	value       = azurerm_service_plan.app_service.id
}

output "function_app_service_plan_id" {
	description = "Function App 用 App Service Plan ID"
	value       = azurerm_service_plan.function_app.id
}

output "service_plan_02_id" {
	description = "Function App 用 App Service Plan ID（互換性のため）"
	value       = azurerm_service_plan.function_app.id
}

output "frontend_app_service_name" {
	description = "Frontend App Service 名"
	value       = azurerm_linux_web_app.frontend.name
}

output "frontend_app_service_id" {
	description = "Frontend App Service ID"
	value       = azurerm_linux_web_app.frontend.id
}

output "frontend_app_service_default_hostname" {
	description = "Frontend App Service のデフォルトホスト名"
	value       = azurerm_linux_web_app.frontend.default_hostname
}

output "frontend_app_service_identity_principal_id" {
	description = "Frontend App Service の Managed Identity Principal ID"
	value       = azurerm_linux_web_app.frontend.identity[0].principal_id
}

output "frontend_application_insights_connection_string" {
	description = "Frontend Application Insights 接続文字列"
	value       = azurerm_application_insights.frontend.connection_string
	sensitive   = true
}

output "loadbalancer_app_service_name" {
	description = "LoadBalancer App Service 名"
	value       = azurerm_linux_web_app.loadbalancer.name
}

output "loadbalancer_app_service_id" {
	description = "LoadBalancer App Service ID"
	value       = azurerm_linux_web_app.loadbalancer.id
}

output "loadbalancer_app_service_default_hostname" {
	description = "LoadBalancer App Service のデフォルトホスト名"
	value       = azurerm_linux_web_app.loadbalancer.default_hostname
}

output "loadbalancer_hostname" {
	description = "LoadBalancer App Service のデフォルトホスト名（互換性のため）"
	value       = azurerm_linux_web_app.loadbalancer.default_hostname
}

output "loadbalancer_app_service_identity_principal_id" {
	description = "LoadBalancer App Service の Managed Identity Principal ID"
	value       = azurerm_linux_web_app.loadbalancer.identity[0].principal_id
}
