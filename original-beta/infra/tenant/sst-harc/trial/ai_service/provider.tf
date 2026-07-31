terraform {
  required_version = "= 1.14.3"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>4.56.0"
    }

    azapi = {
      source  = "azure/azapi"
      version = "~> 2.0"
    }

  }
  backend "azurerm" {
    resource_group_name = "rg-tfstate-hsuibu" # H推部検証環境

    # storage_account_name = "" # 各環境で適切な値を設定してください
    # storage_account_name = "genashitfstate003" # ハンズオン環境
    storage_account_name = "tfstatehsuibu001" # H推部検証環境

    container_name = "tfstate" # 各環境で共通で使用可能
    key            = "ai_service/terraform.tfstate"
  }
}
