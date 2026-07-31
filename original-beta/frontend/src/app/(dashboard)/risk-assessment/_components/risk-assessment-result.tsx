import { useEffect, useState } from 'react';
import { Label } from '@/app/_components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';

import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import ActionButtons from './action-buttons';

type Props = {
  className?: string;
};
type ParsedData = {
  table: {
    headers: string[];
    rows: string[][];
  };
};

export default function RiskAssessmentResult({ className }: Props) {
  const { result } = useAppSelector((state) => state.riskAssessment);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  useEffect(() => {
    if (result) {
      const parsedData: ParsedData = JSON.parse(result);
      setParsedData(parsedData);
    } else {
      setParsedData(null);
    }
  }, [result]);

  // const columnWidths = ['w-2/5', 'w-[50px]', 'w-[240px]'];

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">作成結果</Label>
        <ActionButtons />
      </div>
      <div className="relative h-full">
        {parsedData ? (
          <div className="flex-1 overflow-hidden rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow>
                  {parsedData &&
                    parsedData.table.headers.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody className="overflow-auto">
                {parsedData &&
                  parsedData.table.rows.map((row, rowIndex) => (
                    <TableRow className="cursor-pointer" key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell || '-'}</TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="mt-4">
              <div className="flex h-72 items-center justify-center rounded-md border bg-gray-50 p-4">
                <p className="text-center">
                  <span className="text-muted-foreground">
                    ここに生成されたリスクアセスメントシートが表示されます
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
