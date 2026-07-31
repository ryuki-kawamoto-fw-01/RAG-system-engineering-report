import { AzureCliCredential, ManagedIdentityCredential } from '@azure/identity';
import { isDevelopment } from '../../../../config';

export const credentialClient = isDevelopment
  ? new AzureCliCredential()
  : new ManagedIdentityCredential();

export const AOAI_SCOPE = 'https://cognitiveservices.azure.com/.default';
