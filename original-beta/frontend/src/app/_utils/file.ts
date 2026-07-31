export interface FileData {
  file: string;
  name: string;
  type: string;
}
export const encodeFileToBase64 = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      resolve(fr.result as string);
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
};

export const decodeBase64ToFile = (file: FileData): File => {
  if (file instanceof File) return file;
  const byteCharacters = atob(file.file.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], file.name, { type: file.type });
};

export const getBase64Files = (files: FileList | undefined) => {
  const base64Data = files
    ? Array.from(files).map(async (file) => {
        return file instanceof File
          ? {
              file: await encodeFileToBase64(file),
              name: file.name,
              type: file.type,
            }
          : file;
      })
    : [];

  return Promise.all(base64Data ?? []);
};

export const getBase64ToFiles = (files: FileData[]): FileList => {
  const dataTransfer = new DataTransfer();
  files?.forEach((file) => {
    dataTransfer.items.add(decodeBase64ToFile(file));
  });
  return dataTransfer.files;
};

export const formatFileSize = (size: number, fractionDigits = 2) => {
  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let unitIndex = -1;
  do {
    size /= 1024;
    unitIndex++;
  } while (size >= 1024 && unitIndex < units.length - 1);

  return `${size.toFixed(fractionDigits)} ${units[unitIndex]}`;
};

export const arrayToFileList = (files: File[]) => {
  const dataTransfer = new DataTransfer();

  files.forEach((file) => {
    dataTransfer.items.add(file);
  });

  return dataTransfer.files;
};
export const getExtension = (filename: string): string => {
  if (!filename) {
    return ''; // ファイル名が空または無効な場合は空文字列を返す
  }

  const dotIndex = filename.lastIndexOf('.');

  // ドットが存在しない、またはドットが最初の文字の場合（隠しファイル）は空文字列を返す
  if (dotIndex <= 0 || dotIndex === filename.length - 1) {
    return '';
  }

  // 拡張子を返す（.txt、.pdfなど）
  return filename.slice(dotIndex);
};

export function getUniqueFileName(existingFiles: string[], newFileName: string): string {
  const baseName = newFileName.slice(0, newFileName.lastIndexOf('.'));
  const extension = newFileName.slice(newFileName.lastIndexOf('.'));
  let uniqueFileName = newFileName;
  let counter = 1;

  // ファイル名が重複する限り、名前を変更
  while (existingFiles.includes(uniqueFileName)) {
    uniqueFileName = `${baseName}(${counter})${extension}`;
    counter++;
  }

  return uniqueFileName;
}

// fileオブジェクトからフォルダを含めたパスを取得
export function getFileFullPath(file: File): string {
  let filePath = file.name;

  // webkitRelativePath が存在する場合(フォルダ選択など)
  if (file.webkitRelativePath && file.webkitRelativePath !== '') {
    filePath = file.webkitRelativePath;
  }
  // relativePath が存在する場合(ドロップゾーンなど)
  else if ('relativePath' in file && file.relativePath !== '') {
    filePath = file.relativePath as string;
  }
  // path が存在する場合
  else if ('path' in file && file.path !== '') {
    filePath = file.path as string;
  }

  // ファイルパスが '/' から始まる場合、先頭のスラッシュを削除
  if (filePath.startsWith('/')) {
    return filePath.slice(1);
  }

  return filePath;
}

export function getFileFolderPath(file: File): string[] {
  const filepath = getFileFullPath(file);
  if (!filepath) {
    return [];
  }
  return filepath.split('/').slice(0, -1);
}

export function splitFileName(fileName: string) {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) {
    return { name: fileName, extension: '' };
  }

  return {
    name: fileName.slice(0, lastDot),
    ext: fileName.slice(lastDot),
  };
}
