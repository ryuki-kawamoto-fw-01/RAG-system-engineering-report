// 登録文書の上限サイズ(文書登録画面)
export const MAX_DOCUMENT_REGISTER_SIZE = 20 * 1024 * 1024; // 20MB

// ファイル名の最大文字数
export const MAX_FILENAME_LENGTH = 100;

// ファイル名で使用できない文字
export const INVALID_FILENAME_CHARACTERS = '\\/:*?"<>|';

// フォルダ名の最大文字数
export const MAX_FOLDERNAME_LENGTH = 100;

// フォルダ名で使用できない文字
export const INVALID_FOLDERNAME_CHARACTERS = '\\/:*?"<>|';

// メディアタイプ一覧
export const MEDIA_TYPES = {
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

// 文書登録の対応ファイル一覧(dropzone用)
export const DOCUMENT_REGISTER_ACCEPT_FILES = {
  [MEDIA_TYPES.pdf]: ['.pdf'],
  [MEDIA_TYPES.txt]: ['.txt'],
  [MEDIA_TYPES.csv]: ['.csv'],
  [MEDIA_TYPES.docx]: ['.docx'],
  [MEDIA_TYPES.xlsx]: ['.xlsx'],
  [MEDIA_TYPES.pptx]: ['.pptx'],
};

// 文書登録の対応ファイル一覧(拡張子の列)
export const DOCUMENT_REGISTER_EXTENSIONS = Object.values(DOCUMENT_REGISTER_ACCEPT_FILES).flatMap(
  (ext) => ext
);

// 文書登録の対応ファイル一覧(表示用)
export const DOCUMENT_REGISTER_ACCEPT_FILE_STRING = DOCUMENT_REGISTER_EXTENSIONS.join(' ');

// 規格登録の対応ファイル一覧(dropzone用)
export const STANDARD_REGISTER_ACCEPT_FILES = {
  [MEDIA_TYPES.pdf]: ['.pdf'],
};

// 規格登録の対応ファイル一覧(拡張子の列)
export const STANDARD_REGISTER_EXTENSIONS = Object.values(STANDARD_REGISTER_ACCEPT_FILES).flatMap(
  (ext) => ext
);

// 規格登録の対応ファイル一覧(表示用の文字列)
export const STANDARD_REGISTER_ACCEPT_FILE_STRING = STANDARD_REGISTER_EXTENSIONS.join(' ');
