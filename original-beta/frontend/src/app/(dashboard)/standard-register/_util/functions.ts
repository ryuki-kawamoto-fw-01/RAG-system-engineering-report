import {
  standardRegisterAzureFunctions,
  documentRegisterAzureFunctions,
} from '../../../../../azure-functions';

if (
  !process.env.ORCHESTRATOR_DOCUMENT_API_ENDPOINT ||
  !process.env.ORCHESTRATOR_DOCUMENT_API_CREDENTIAL
) {
  throw new Error(
    'ORCHESTRATOR_DOCUMENT_API_ENDPOINT and ORCHESTRATOR_DOCUMENT_API_CREDENTIAL must be set'
  );
}

if (
  !process.env.ORCHESTRATOR_STANDARD_API_ENDPOINT ||
  !process.env.ORCHESTRATOR_STANDARD_API_CREDENTIAL
) {
  throw new Error(
    'ORCHESTRATOR_STANDARD_API_ENDPOINT and ORCHESTRATOR_STANDARD_API_CREDENTIAL must be set'
  );
}

const STANDARD_CONTAINER_NAMES = [
  process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME,
  process.env.NEXT_PUBLIC_STANDARD_PREVIEW_STORAGE_CONTAINER_NAME,
];

export function getTextRegisterAzureFunctions(containerName: string) {
  if (STANDARD_CONTAINER_NAMES.includes(containerName)) {
    return standardRegisterAzureFunctions;
  }
  return documentRegisterAzureFunctions;
}
