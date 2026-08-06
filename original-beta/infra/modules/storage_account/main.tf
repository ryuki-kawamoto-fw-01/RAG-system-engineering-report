# =============================================================================
# Storage Account Module - Main
# =============================================================================
# 責務: Storage Account、Blob Container、Queue、フォルダプレースホルダー作成
# 特徴:
# - Blob/コンテナー/ファイル共有の論理的削除（7日間保持、default値固定）
# - 診断設定（Blob Service用、Queue Service用）
# - ネットワーク制御・Phase制御は呼び出し側に委譲
# 注意: init_flagは呼び出し側でPhase制御済みのため本モジュール内では未使用
# =============================================================================

# -----------------------------------------------------------------------------
# Storage Account
# -----------------------------------------------------------------------------

resource "azurerm_storage_account" "main" {
  name                = var.storage_account_name
  resource_group_name = var.resource_group_name
  location            = var.location

  # パフォーマンス・冗長性
  account_tier             = var.account_tier             # Standard
  account_replication_type = var.account_replication_type # LRS
  account_kind             = var.account_kind             # StorageV2

  # アクセス層
  access_tier = var.access_tier # Hot

  # セキュリティ設定
  https_traffic_only_enabled      = true  # REST API安全な転送: 有効
  min_tls_version                 = "TLS1_2"  # TLS最小バージョン: 1.2
  allow_nested_items_to_be_public = false # 匿名アクセス: 無効
  shared_access_key_enabled       = true  # ストレージアカウントキーアクセス: 有効

  # ネットワーク設定（公開アクセス・デフォルトアクションは呼び出し側から制御）
  public_network_access_enabled = var.public_network_access_enabled

  # ネットワークルール
  network_rules {
    default_action             = var.network_default_action
    bypass                     = ["AzureServices"]
    virtual_network_subnet_ids = var.network_subnet_ids
  }

  # ルーティング設定
  routing {
    choice = var.routing_choice # MicrosoftRouting
  }

  # Blob サービスプロパティ
  blob_properties {
    # Blobの論理的な削除: 有効、保持期間7日
    delete_retention_policy {
      days = var.blob_soft_delete_retention_days
    }

    # コンテナーの論理的な削除: 有効、保持期間7日
    container_delete_retention_policy {
      days = var.container_soft_delete_retention_days
    }
  }

  # 【要確認】Queue サービスプロパティ
  # 設計書にQueue用の論理的削除の記載が見つからない場合、
  # Azureのデフォルト動作に依存
  # Queue soft deleteはAzure Storageで標準サポートされていないため、
  # 以下のブロックは実装しない

  # ファイル共有サービスプロパティ
  share_properties {
    # ファイル共有の論理的な削除: 有効、保持期間7日
    retention_policy {
      days = var.file_share_soft_delete_retention_days
    }
  }

  # 【要確認】SystemAssigned Identity: 呼び出し側main.tf・設計書に明示的な根拠なし
  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Blob Containers
# -----------------------------------------------------------------------------

resource "azurerm_storage_container" "containers" {
  for_each = { for c in var.containers : c.name => c }

  name                  = each.value.name
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = each.value.container_access_type
}

# -----------------------------------------------------------------------------
# Storage Queues
# -----------------------------------------------------------------------------
# 【要確認】設計書にQueue名の記載がないため、queues変数で制御
# Private Endpoint (queue) が定義されているため、Queueは使用される想定
# 具体的なQueue名と用途を設計書で確認してください

resource "azurerm_storage_queue" "queues" {
  for_each = toset(var.queues)

  name               = each.value
  storage_account_id = azurerm_storage_account.main.id
}

# -----------------------------------------------------------------------------
# フォルダプレースホルダー（空Blobによる仮想ディレクトリ表現）
# -----------------------------------------------------------------------------

resource "azurerm_storage_blob" "folder_placeholders" {
  for_each = var.folder_placeholders

  name                   = "${each.value.folder_path}/.keep"
  storage_account_name   = azurerm_storage_account.main.name
  storage_container_name = each.value.container_name
  type                   = "Block"
  source_content         = ""

  depends_on = [azurerm_storage_container.containers]
}

# -----------------------------------------------------------------------------
# 診断設定 (Blob Service)
# -----------------------------------------------------------------------------

resource "azurerm_monitor_diagnostic_setting" "blob" {
  count = var.enable_blob_diagnostic_setting ? 1 : 0

  name                       = var.blob_diagnostic_setting_name
  target_resource_id         = "${azurerm_storage_account.main.id}/blobServices/default"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category_group = "allLogs"
  }

  enabled_metric {
    category = "Transaction"
  }
}

# -----------------------------------------------------------------------------
# 診断設定 (Queue Service)
# -----------------------------------------------------------------------------

resource "azurerm_monitor_diagnostic_setting" "queue" {
  count = var.enable_queue_diagnostic_setting && length(var.queues) > 0 ? 1 : 0

  name                       = var.queue_diagnostic_setting_name
  target_resource_id         = "${azurerm_storage_account.main.id}/queueServices/default"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category_group = "allLogs"
  }

  enabled_metric {
    category = "Transaction"
  }
}
