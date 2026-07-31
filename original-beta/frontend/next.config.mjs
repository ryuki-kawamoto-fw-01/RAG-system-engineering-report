/** @type {import('next').NextConfig} */

// SAS経由で画像を表示するためにBLOB Storageのドメインを登録
const remotePatterns = [];
if (process.env.AZURE_MANUAL_BLOB_STORAGE_HOSTNAME) {
  remotePatterns.push({
    protocol: 'https',
    hostname: process.env.AZURE_MANUAL_BLOB_STORAGE_HOSTNAME,
    pathname: '/**',
  });
}

const nextConfig = {
  output: 'standalone',  // Azure App Service用にstandaloneビルド
  experimental: {
    serverMinification: false,
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  images: {
    remotePatterns,
  },
};

export default nextConfig;
