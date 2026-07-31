import { ErrorResponse } from '../../_actions/types';

export type Item = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: string;
  modified: string;
  items?: Item[];
};

export type Folder = {
  id: string;
  name: string;
  items: Item[];
};

export type GetFileUrlResponse =
  | {
      url: string;
      success: boolean;
      title: string;
      media_type: string;
      size: number;
    }
  | ErrorResponse;

export type GetFileInfoResponse =
  | {
      success: boolean;
      title: string;
      media_type: string;
      size: number;
    }
  | ErrorResponse;

export type GetFilesResponse =
  | {
      files: Folder[];
      success: true;
    }
  | ErrorResponse;

export type FileUploadResponse =
  | {
      success: true;
      filename: string;
    }
  | (ErrorResponse & {
      filename: string;
    });

export type FolderUploadResponse =
  | {
      success: true;
      folder: string;
    }
  | (ErrorResponse & {
      folder: string;
    });
export type RenameResponse = {
  success: boolean;
  message?: string;
};

export type DownloadFolderRequest = {
  prefix: string;
  container_name?: string;
};

export type DownloadFolderResponse =
  | {
      success: true;
      data: string;
      statusCode: number;
    }
  | {
      success: false;
      message: string;
      statusCode: number;
    };
