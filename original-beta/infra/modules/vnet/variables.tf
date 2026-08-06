variable "vnet_name" {
  description = "VNET名"
  type        = string
}

variable "location_name" {
  description = "ロケーション名"
  type        = string
}

variable "resource_group_name" {
  type        = string
  description = "リソースグループ名"
}

variable "address_space" {
  type        = list(string)
  description = "アドレス空間"
}

variable "subnet_01_name" {
  type        = string
  description = "サブネット1名"
}

variable "subnet_01_address_prefix" {
  type        = string
  description = "サブネット1アドレスプレフィックス"
}

variable "subnet_02_name" {
  type        = string
  description = "サブネット2名"
}

variable "subnet_02_address_prefix" {
  type        = string
  description = "サブネット2アドレスプレフィックス"
}

variable "subnet_03_name" {
  type        = string
  description = "サブネット3名"
}

variable "subnet_03_address_prefix" {
  type        = string
  description = "サブネット3アドレスプレフィックス"
}

variable "tags" {
  description = "リソースに適用するタグ"
  type        = map(string)
  default     = {}
}
