# =============================================================================
# Private Endpoint Module
# =============================================================================
# Azure Private Endpointを作成し、Private DNS Zoneと紐付ける汎用モジュール
#
# 設計方針:
# - Private Endpoint専用サブネット(subnet_01)に配置
# - Private DNS Zone Groupで名前解決を自動構成
# - Network Interface名は "nic-{リソース識別子}" の命名規則に従う
# =============================================================================

# -----------------------------------------------------------------------------
# Private Endpoint
# -----------------------------------------------------------------------------
# 対象リソースへの閉域接続エンドポイントを作成
#
# 主要パラメータ:
# - name: Private Endpoint名 (pep-{リソース名}の命名規則)
# - custom_network_interface_name: NIC名 (nic-{リソース名}の命名規則)
# - subnet_id: Private Endpoint配置先サブネット (subnet_01)
# - private_service_connection: 接続対象リソースとsubresource_nameを指定
# - private_dns_zone_group: Private DNS Zoneとの紐付け設定
#   (enable_private_dns_zone_group=true かつ private_dns_zone_ids が
#    1件以上ある場合のみ作成する)
# -----------------------------------------------------------------------------

resource "azurerm_private_endpoint" "genashi" {
  name                          = var.private_endpoint_name
  location                      = var.location
  resource_group_name           = var.resource_group_name
  subnet_id                     = var.subnet_id
  custom_network_interface_name = var.custom_network_interface_name

  private_service_connection {
    name                           = var.connection_name
    private_connection_resource_id = var.target_resource_id
    subresource_names              = var.subresource_names
    is_manual_connection           = false
  }

  dynamic "private_dns_zone_group" {
    for_each = var.enable_private_dns_zone_group && length(var.private_dns_zone_ids) > 0 ? [1] : []
    content {
      name                 = var.dns_zone_group_name
      private_dns_zone_ids = var.private_dns_zone_ids
    }
  }

  tags = var.tags
}
