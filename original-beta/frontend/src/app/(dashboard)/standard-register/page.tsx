import { DocumentRegister } from '../document-register/_components/document-register';

export default function Page() {
  const containerName = process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME || null;
  return <DocumentRegister containerName={containerName} />;
}
