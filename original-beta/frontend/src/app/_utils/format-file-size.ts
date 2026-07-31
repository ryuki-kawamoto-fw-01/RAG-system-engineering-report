type FileSizeUnit = {
  value: number;
  unit: string;
};

type FormatFileSizeInput = {
  bytes: number | null | undefined;
  round?: number; // 小数点以下の桁数
  fallbackText?: string; // null や undefined の場合に返す代替テキスト
};

type GetFileSizeUnitInput = {
  bytes: number;
  round?: number | undefined; // 小数点以下の桁数
};

const FILE_SIZE_UNITS = [
  { unit: 'TB', bytes: 1024 ** 4 },
  { unit: 'GB', bytes: 1024 ** 3 },
  { unit: 'MB', bytes: 1024 ** 2 },
  { unit: 'KB', bytes: 1024 },
  { unit: 'bytes', bytes: 1 },
];

function getFileSizeUnit({ bytes, round }: GetFileSizeUnitInput): FileSizeUnit {
  for (const { unit, bytes: unitBytes } of FILE_SIZE_UNITS) {
    if (bytes >= unitBytes) {
      const value = parseFloat((bytes / unitBytes).toFixed(round ?? 2));
      // 単数形と複数形を切り替え
      const adjustedUnit = value === 1 && unit === 'bytes' ? 'byte' : unit;
      return { value, unit: adjustedUnit };
    }
  }
  return { value: 0, unit: 'byte' };
}

function formatFileSize({ bytes, fallbackText, round }: FormatFileSizeInput): string {
  if (bytes === null || bytes === undefined) {
    return fallbackText ?? '';
  }

  const { value, unit } = getFileSizeUnit({ bytes, round });
  if (round !== undefined) {
    return `${value.toFixed(round)} ${unit}`;
  }

  return `${value} ${unit}`;
}

export { getFileSizeUnit, formatFileSize };
