locals {
	# 呼び出し側からベース/追加/差し替えを渡せるようにし、
	# module内への環境依存IPの直書きを避ける。
	frontend_ip_restrictions = var.frontend_ip_restrictions_override != null ? var.frontend_ip_restrictions_override : concat(
		var.frontend_base_ip_restrictions,
		var.frontend_additional_ip_restrictions
	)

	frontend_key_vault_name = var.frontend_key_vault_id == null ? null : element(
		split("/", var.frontend_key_vault_id),
		length(split("/", var.frontend_key_vault_id)) - 1
	)

	frontend_auth_secret_value = (
		var.init_flag || var.frontend_key_vault_id == null
		? var.frontend_auth_client_secret
		: "@Microsoft.KeyVault(VaultName=${local.frontend_key_vault_name};SecretName=MICROSOFT-PROVIDER-AUTHENTICATION-SECRET)"
	)

	frontend_diagnostic_setting_name = coalesce(
		var.frontend_diagnostic_setting_name,
		"diag-${var.frontend_app_service_name}"
	)

	loadbalancer_diagnostic_setting_name = coalesce(
		var.loadbalancer_diagnostic_setting_name,
		"diag-${var.loadbalancer_app_service_name}"
	)

	frontend_app_settings = merge(
		var.frontend_app_settings,
		{
			APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.frontend.connection_string
			MICROSOFT_PROVIDER_AUTHENTICATION_SECRET = local.frontend_auth_secret_value
			WEBSITE_RUN_FROM_PACKAGE                 = "1"
		}
	)

	loadbalancer_app_settings = merge(
		var.loadbalancer_app_settings,
		{
			APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.loadbalancer.connection_string
			WEBSITE_RUN_FROM_PACKAGE             = "1"
		}
	)
}

data "azurerm_client_config" "current" {}

resource "azurerm_service_plan" "app_service" {
	name                = var.app_service_plan_name
	resource_group_name = var.resource_group_name
	location            = var.location
	os_type             = "Linux"
	sku_name            = var.app_service_sku_name

	tags = var.tags
}

resource "azurerm_service_plan" "function_app" {
	name                         = var.function_app_service_plan_name
	resource_group_name          = var.resource_group_name
	location                     = var.location
	os_type                      = "Linux"
	sku_name                     = var.function_app_sku_name
	maximum_elastic_worker_count = var.function_app_service_plan_maximum_elastic_worker_count

	tags = var.tags
}

resource "azurerm_application_insights" "frontend" {
	name                = var.frontend_application_insights_name
	location            = var.location
	resource_group_name = var.resource_group_name
	workspace_id        = var.log_analytics_workspace_id
	application_type    = "web"

	tags = var.tags
}

resource "azurerm_application_insights" "loadbalancer" {
	name                = var.loadbalancer_application_insights_name
	location            = var.location
	resource_group_name = var.resource_group_name
	workspace_id        = var.log_analytics_workspace_id
	application_type    = "web"

	tags = var.tags
}

resource "azurerm_linux_web_app" "frontend" {
	name                = var.frontend_app_service_name
	location            = var.location
	resource_group_name = var.resource_group_name
	service_plan_id     = azurerm_service_plan.app_service.id
	https_only          = true

	public_network_access_enabled                  = true
	client_affinity_enabled                        = false
	webdeploy_publish_basic_authentication_enabled = false
	ftp_publish_basic_authentication_enabled       = false
	virtual_network_subnet_id                      = var.init_flag ? null : var.frontend_subnet_id

	identity {
		type = "SystemAssigned"
	}

	site_config {
		always_on           = true
		http2_enabled       = false
		ftps_state          = "Disabled"
		minimum_tls_version = "1.2"
		vnet_route_all_enabled = var.init_flag ? false : var.frontend_vnet_route_all_enabled

		ip_restriction_default_action = var.init_flag ? "Allow" : "Deny"
		scm_ip_restriction_default_action = var.init_flag ? "Allow" : "Deny"
		scm_use_main_ip_restriction       = !var.init_flag

		application_stack {
			node_version = var.frontend_app_service_runtime_stack
		}

		dynamic "ip_restriction" {
			for_each = var.init_flag ? [] : local.frontend_ip_restrictions
			content {
				name        = ip_restriction.value.name
				ip_address  = try(ip_restriction.value.ip_address, null)
				service_tag = try(ip_restriction.value.service_tag, null)
				priority    = ip_restriction.value.priority
				action      = ip_restriction.value.action
			}
		}
	}

	app_settings = local.frontend_app_settings

	dynamic "auth_settings_v2" {
		for_each = var.frontend_auth_client_id == null ? [] : [1]
		content {
			auth_enabled           = true
			require_authentication = true
			unauthenticated_action = "RedirectToLoginPage"
			default_provider       = "azureactivedirectory"

			active_directory_v2 {
				client_id                  = var.frontend_auth_client_id
				client_secret_setting_name = "MICROSOFT_PROVIDER_AUTHENTICATION_SECRET"
				tenant_auth_endpoint       = "https://sts.windows.net/${coalesce(var.frontend_auth_tenant_id, data.azurerm_client_config.current.tenant_id)}/v2.0"
				allowed_audiences          = ["api://${var.frontend_auth_client_id}"]
			}

			login {
				token_store_enabled = true
			}
		}
	}

	tags = var.tags

	lifecycle {
		ignore_changes = [
			app_settings["WEBSITE_RUN_FROM_PACKAGE"],
			app_settings["SCM_DO_BUILD_DURING_DEPLOYMENT"]
		]
	}
}

resource "azurerm_linux_web_app" "loadbalancer" {
	name                = var.loadbalancer_app_service_name
	location            = var.location
	resource_group_name = var.resource_group_name
	service_plan_id     = azurerm_service_plan.app_service.id
	https_only          = true

	public_network_access_enabled                  = var.init_flag
	client_affinity_enabled                        = false
	webdeploy_publish_basic_authentication_enabled = false
	ftp_publish_basic_authentication_enabled       = false
	virtual_network_subnet_id                      = var.init_flag ? null : var.loadbalancer_subnet_id

	identity {
		type = "SystemAssigned"
	}

	site_config {
		always_on                        = true
		http2_enabled                    = false
		ftps_state                       = "Disabled"
		minimum_tls_version              = "1.2"
		vnet_route_all_enabled           = var.init_flag ? false : var.loadbalancer_vnet_route_all_enabled
		scm_ip_restriction_default_action = "Allow"
		scm_use_main_ip_restriction       = !var.init_flag

		application_stack {
			dotnet_version = var.loadbalancer_app_service_runtime_stack
		}

		ip_restriction {
			name       = "allow-all"
			priority   = 2147483647
			action     = "Allow"
			ip_address = "0.0.0.0/0"
		}
	}

	app_settings = local.loadbalancer_app_settings

	tags = var.tags

	lifecycle {
		ignore_changes = [
			app_settings["WEBSITE_RUN_FROM_PACKAGE"],
			app_settings["SCM_DO_BUILD_DURING_DEPLOYMENT"]
		]
	}
}

resource "azapi_update_resource" "frontend_scm_basic_auth" {
	count = var.enable_basic_publishing_credentials_policy ? 1 : 0

	type        = "Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01"
	resource_id = "${azurerm_linux_web_app.frontend.id}/basicPublishingCredentialsPolicies/scm"

	body = {
		properties = {
			allow = false
		}
	}
}

resource "azapi_update_resource" "frontend_ftp_basic_auth" {
	count = var.enable_basic_publishing_credentials_policy ? 1 : 0

	type        = "Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01"
	resource_id = "${azurerm_linux_web_app.frontend.id}/basicPublishingCredentialsPolicies/ftp"

	body = {
		properties = {
			allow = false
		}
	}
}

resource "azapi_update_resource" "loadbalancer_scm_basic_auth" {
	count = var.enable_basic_publishing_credentials_policy ? 1 : 0

	type        = "Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01"
	resource_id = "${azurerm_linux_web_app.loadbalancer.id}/basicPublishingCredentialsPolicies/scm"

	body = {
		properties = {
			allow = false
		}
	}
}

resource "azapi_update_resource" "loadbalancer_ftp_basic_auth" {
	count = var.enable_basic_publishing_credentials_policy ? 1 : 0

	type        = "Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01"
	resource_id = "${azurerm_linux_web_app.loadbalancer.id}/basicPublishingCredentialsPolicies/ftp"

	body = {
		properties = {
			allow = false
		}
	}
}

resource "azurerm_key_vault_secret" "frontend_auth" {
	count = var.init_flag || var.frontend_auth_client_secret == null ? 0 : 1

	name         = "MICROSOFT-PROVIDER-AUTHENTICATION-SECRET"
	value        = var.frontend_auth_client_secret
	key_vault_id = var.frontend_key_vault_id
}

resource "azurerm_monitor_diagnostic_setting" "frontend" {
	name                       = local.frontend_diagnostic_setting_name
	target_resource_id         = azurerm_linux_web_app.frontend.id
	log_analytics_workspace_id = var.log_analytics_workspace_id

	enabled_log {
		category_group = "allLogs"
	}

	enabled_metric {
		category = "AllMetrics"
	}
}

resource "azurerm_monitor_diagnostic_setting" "loadbalancer" {
	name                       = local.loadbalancer_diagnostic_setting_name
	target_resource_id         = azurerm_linux_web_app.loadbalancer.id
	log_analytics_workspace_id = var.log_analytics_workspace_id

	enabled_log {
		category_group = "allLogs"
	}

	enabled_metric {
		category = "AllMetrics"
	}
}

resource "azurerm_role_assignment" "frontend_key_vault_secrets_user" {
	count = var.create_key_vault_role_assignment ? 1 : 0

	scope                = var.frontend_key_vault_id
	role_definition_name = "Key Vault Secrets User"
	principal_id         = azurerm_linux_web_app.frontend.identity[0].principal_id

	skip_service_principal_aad_check = true
}

resource "azurerm_cosmosdb_sql_role_assignment" "frontend" {
	count = var.create_cosmos_db_role_assignment ? 1 : 0

	resource_group_name = var.resource_group_name
	account_name = element(
		split("/", var.frontend_cosmos_db_id),
		length(split("/", var.frontend_cosmos_db_id)) - 1
	)
	role_definition_id = "${var.frontend_cosmos_db_id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
	principal_id       = azurerm_linux_web_app.frontend.identity[0].principal_id
	scope              = var.frontend_cosmos_db_id
}
