import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';

export async function uploadImageToBlob(
  base64: string,
  fileName: string,
  imageFormat: string // 追加: 画像形式（例: 'png', 'jpeg'）
): Promise<string> {
  const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  const containerName = 'images';

  // base64データからBuffer生成
  const buffer = Buffer.from(base64, 'base64');

  // BlobServiceClient初期化
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // ContentTypeを形式に応じて設定
  const contentType = `image/${imageFormat}`;
  const ext = imageFormat === 'jpeg' ? 'jpg' : imageFormat;
  const blobFileName = fileName.endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`;

  // Blobアップロード
  const blockBlobClient = containerClient.getBlockBlobClient(blobFileName);
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  // SASトークン生成
  // ストレージアカウント名とキーを取得
  const matches = AZURE_STORAGE_CONNECTION_STRING.match(/AccountName=([^;]+);AccountKey=([^;]+)/);
  if (!matches) throw new Error('ストレージ接続文字列が不正です');
  const accountName = matches[1];
  const accountKey = matches[2];

  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

  // SASの有効期限（例: 1時間）
  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + 1);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: blobFileName,
      permissions: BlobSASPermissions.parse('r'), // 読み取りのみ
      expiresOn,
    },
    sharedKeyCredential
  ).toString();

  // SAS付きURLを返す
  return `${blockBlobClient.url}?${sasToken}`;
}
