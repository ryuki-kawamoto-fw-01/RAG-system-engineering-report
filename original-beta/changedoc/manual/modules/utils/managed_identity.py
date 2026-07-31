from azure.identity import DefaultAzureCredential


def get_managed_identity_token() -> str:
    """
    Get the managed identity token for Azure services.

    Args:
        None

    Returns:
        str: The token
    """

    credential = DefaultAzureCredential()
    token = credential.get_token("https://cognitiveservices.azure.com/.default")
    return token.token
