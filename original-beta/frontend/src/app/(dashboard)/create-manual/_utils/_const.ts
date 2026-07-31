export const DOWNLOAD_OPTIONS = [
  { value: '.xlsx', label: 'Excel' },
  { value: '.docx', label: 'Word' },
  { value: '.md', label: 'Markdown' },
];

export const SIMILARITY_OPTIONS = [
  { value: -2.0, label: '自動' },
  { value: 0.9, label: '多め（詳細な手順）' },
  { value: 0.95, label: '普通（標準的な手順）' },
  { value: 0.99, label: '少なめ（簡潔な手順）' },
];

export const ALLOWED_FILE_TYPES = {
  'video/mp4': ['.mp4'],
  'video/avi': ['.avi'],
  'video/mov': ['.mov'],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 動画からマニュアル作成の容量
