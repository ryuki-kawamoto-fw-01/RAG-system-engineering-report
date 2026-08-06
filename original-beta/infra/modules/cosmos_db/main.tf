locals {
	# failover_locations は object 配列として受け取り、
	# azurerm_cosmosdb_account.geo_location が期待する形に整形する。
	geo_locations = length(var.failover_locations) > 0 ? [
		for loc in var.failover_locations : {
			location          = loc.location
			failover_priority = try(loc.failover_priority, index(var.failover_locations, loc))
			zone_redundant    = try(loc.zone_redundant, false)
		}
	] : [{
		location          = var.location
		failover_priority = 0
		zone_redundant    = false
	}]

	# DB名をキーにして for_each 用マップへ変換する。
	database_map = {
		for db in var.databases : db.name => db
	}

	# 各 DB 配下のコンテナ配列を平坦化し、親 DB 名を付与する。
	container_list = flatten([
		for db in var.databases : [
			for container in try(db.containers, []) : merge(container, {
				database_name = db.name
			})
		]
	])

	# コンテナを for_each で一意に扱えるように "DB名/コンテナ名" でキー化する。
    # Cosmos DBのDatabase定義を一意に管理するために、Database名をキーにしたマップを作成する。
	container_map = {
		for c in local.container_list : "${c.database_name}/${c.name}" => c
	}
}

# Cosmos DB アカウント本体。
# ネットワーク制御、一貫性、バックアップ、フェールオーバーを定義する。
resource "azurerm_cosmosdb_account" "main" {
	name                = var.cosmosdb_account_name
	location            = var.location
	resource_group_name = var.resource_group_name
	offer_type          = "Standard"
	kind                = "GlobalDocumentDB"

	public_network_access_enabled = var.public_network_access_enabled
	# AzureServices のときのみ Azure サービスバイパスを有効化する。
	network_acl_bypass_for_azure_services = var.network_acl_bypass == "AzureServices"
	automatic_failover_enabled             = var.enable_automatic_failover
	multiple_write_locations_enabled       = var.enable_multiple_write_locations
	free_tier_enabled                      = var.enable_free_tier
	analytical_storage_enabled             = var.analytical_storage_enabled
    # geo_locationでフェールオーバー先リージョンを登録する。
	dynamic "geo_location" {
		for_each = local.geo_locations
		content {
			location          = geo_location.value.location
			failover_priority = geo_location.value.failover_priority
			zone_redundant    = geo_location.value.zone_redundant
		}
	}

	capacity {
		# アカウント全体で消費できる RU/s 上限。
		total_throughput_limit = var.total_throughput_limit
	}

	consistency_policy {
		consistency_level       = var.consistency_level
		max_interval_in_seconds = var.consistency_level == "BoundedStaleness" ? var.consistency_max_interval_in_seconds : null
		max_staleness_prefix    = var.consistency_level == "BoundedStaleness" ? var.consistency_max_staleness_prefix : null
	}

	backup {
		# Periodic を選ぶ場合のみ interval/retention を設定する。
        # 障害や誤操作発生時にデータを復旧できるようにするため。
		type                = var.backup_type
		interval_in_minutes = var.backup_type == "Periodic" ? var.backup_interval_in_minutes : null
		retention_in_hours  = var.backup_type == "Periodic" ? var.backup_retention_in_hours : null
		storage_redundancy  = var.backup_storage_redundancy
	}

	tags = var.tags
}

resource "azurerm_cosmosdb_sql_database" "databases" {
	for_each = local.database_map

	name                = each.value.name
	resource_group_name = var.resource_group_name
	account_name        = azurerm_cosmosdb_account.main.name
	# autoscale 指定時は手動 throughput を null にして競合を回避する。
	throughput = (
		try(each.value.autoscale_max_throughput, null) != null
		? try(each.value.autoscale_max_throughput, null)
		: try(each.value.autoscale_settings.max_throughput, null)
	) != null ? null : try(each.value.throughput, null)

	dynamic "autoscale_settings" {
		# 旧形式 autoscale_max_throughput と新形式 autoscale_settings.max_throughput の両対応。
        # Database単位でスループットを自動調整する。
		for_each = (
			try(each.value.autoscale_max_throughput, null) != null
			? try(each.value.autoscale_max_throughput, null)
			: try(each.value.autoscale_settings.max_throughput, null)
		) != null ? [1] : []
		content {
			max_throughput = (
				try(each.value.autoscale_max_throughput, null) != null
				? try(each.value.autoscale_max_throughput, null)
				: try(each.value.autoscale_settings.max_throughput, null)
			)
		}
	}
}

resource "azurerm_cosmosdb_sql_container" "containers" {
	for_each = local.container_map
    # 各Database内にContainerを作成する
	depends_on = [azurerm_cosmosdb_sql_database.databases]
	name                = each.value.name
	resource_group_name = var.resource_group_name
	account_name        = azurerm_cosmosdb_account.main.name
	database_name       = each.value.database_name
	# partition key は配列形式/単一形式のどちらでも受けられるようにする。
    # Azure Cosmos DBは大量データを単一のコンテナに対して複数のパーティションへ分散して保存しており、その振り分け役が Partition Keyである
	partition_key_paths = try(each.value.partition_key_paths, [each.value.partition_key_path])
	partition_key_version = 1
	# autoscale 指定時は手動 throughput を null にして競合を回避する。
	throughput = (
		try(each.value.autoscale_max_throughput, null) != null
		? try(each.value.autoscale_max_throughput, null)
		: try(each.value.autoscale_settings.max_throughput, null)
	) != null ? null : try(each.value.throughput, null)

	dynamic "autoscale_settings" {
		# 旧形式 autoscale_max_throughput と新形式 autoscale_settings.max_throughput の両対応。
		for_each = (
			try(each.value.autoscale_max_throughput, null) != null
			? try(each.value.autoscale_max_throughput, null)
			: try(each.value.autoscale_settings.max_throughput, null)
		) != null ? [1] : []
		content {
			max_throughput = (
				try(each.value.autoscale_max_throughput, null) != null
				? try(each.value.autoscale_max_throughput, null)
				: try(each.value.autoscale_settings.max_throughput, null)
			)
		}
	}
}

# Cosmos DB アカウントの診断ログ/メトリクスを Log Analytics に送る。
resource "azurerm_monitor_diagnostic_setting" "cosmos_db" {
	name                       = var.diagnostic_setting_name
	target_resource_id         = azurerm_cosmosdb_account.main.id
	log_analytics_workspace_id = var.log_analytics_workspace_id
	log_analytics_destination_type = "Dedicated"

	enabled_log {
		category_group = "allLogs"
	}

	enabled_metric {
		category = "Requests"
	}

	enabled_metric {
		category = "SLI"
	}
}

output "cosmosdb_account_id" {
	description = "Cosmos DB account resource ID"
	value       = azurerm_cosmosdb_account.main.id
}

output "id" {
	description = "Cosmos DB account resource ID (compatibility output)"
	value       = azurerm_cosmosdb_account.main.id
}

output "name" {
	description = "Cosmos DB account name"
	value       = azurerm_cosmosdb_account.main.name
}

output "endpoint" {
	description = "Cosmos DB account endpoint"
	value       = azurerm_cosmosdb_account.main.endpoint
}
