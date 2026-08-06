output "system_topic_id" {
	value = azurerm_eventgrid_system_topic.system_topic.id
}

output "system_topic_name" {
	value = azurerm_eventgrid_system_topic.system_topic.name
}

output "system_topic_identity" {
	value = azurerm_eventgrid_system_topic.system_topic.identity[0].principal_id
}

output "pdf_event_subscription_id" {
	value = try(azurerm_eventgrid_system_topic_event_subscription.pdf[0].id, null)
}

output "markdown_event_subscription_id" {
	value = try(azurerm_eventgrid_system_topic_event_subscription.markdown[0].id, null)
}

output "pagesplitter_event_subscription_id" {
	value = try(azurerm_eventgrid_system_topic_event_subscription.pagesplitter[0].id, null)
}
