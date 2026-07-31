import { categories } from '../../../_constants/document-register';

const labelToDisplay = new Map<string, string>(categories.map((c) => [c.blobName, c.label]));

export function mapIndexNameByLabel(blobName: string): string {
  return labelToDisplay.get(blobName) ?? blobName;
}
