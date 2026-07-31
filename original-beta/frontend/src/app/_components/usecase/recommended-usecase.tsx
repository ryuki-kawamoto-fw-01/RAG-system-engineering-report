'use client';

import Link from 'next/link';
import SvgBulb from '@/app/_components/icon/decorative/Bulb';
import SvgGraph from '@/app/_components/icon/decorative/Graph';
import SvgPencil from '@/app/_components/icon/decorative/Pencil';
import SvgManufacture from '@/app/_components/icon/sidebar/Manufacture';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/_components/ui/card';
import { cn } from '@/app/_utils/tw-merge';
import SvgChat from '../icon/sidebar/Chat';

type UsecaseItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  url: string;
};

const usecases: UsecaseItem[] = [
  {
    id: 'minutes',
    title: '議事録',
    description: '文字おこしファイルをExcelフォーマットの議事録に出力可能',
    icon: 'pencil',
    url: '/create-minutes',
  },
  {
    id: 'specification',
    title: '規格検索',
    description: 'AIエージェントを使って社内規格を検索します',
    icon: 'manufacture',
    url: '/agent/specification',
  },
  {
    id: 'analysis',
    title: 'データ分析',
    description: 'データを分析してグラフを作成します',
    icon: 'graph',
    url: '/analysis',
  },
  {
    id: 'correction',
    title: '文章校正',
    description: '文章の誤字脱字や表現を校正します',
    icon: 'pencil',
    url: '/text-correction',
  },
];

type Props = {
  className?: string;
};

export default function RecommendedUsecase({ className = '' }: Props) {
  return (
    <div className={cn('w-full', className)}>
      <h2 className="mb-4 text-xl font-bold">おすすめユースケース</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {usecases.map((usecase) => (
          <UsecaseCard key={usecase.id} usecase={usecase} />
        ))}
      </div>
    </div>
  );
}

type UsecaseCardProps = {
  usecase: UsecaseItem;
};

function UsecaseCard({ usecase }: UsecaseCardProps) {
  return (
    <Link href={usecase.url} className="block w-full">
      <Card className="h-[110px] w-full cursor-pointer rounded-lg border border-neutral-100 bg-white px-4 py-3 shadow-none transition-all duration-300 hover:bg-neutral-50">
        <CardHeader className="p-0">
          <CardTitle className="flex h-[42px] items-center gap-x-2.5 text-base font-bold">
            <UsecaseIcon name={usecase.icon} className="shrink-0" />
            <span className="truncate">{usecase.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-1 p-0">
          <CardDescription className="line-clamp-2 text-xs font-normal text-neutral-500">
            {usecase.description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

type UsecaseIconProps = {
  name: string;
  className?: string;
};

function UsecaseIcon({ name, className }: UsecaseIconProps) {
  const IconComp = (() => {
    switch (name) {
      case 'chat':
        return SvgChat;
      case 'bulb':
        return SvgBulb;
      case 'graph':
        return SvgGraph;
      case 'pencil':
        return SvgPencil;
      case 'manufacture':
        return SvgManufacture;
      default:
        return SvgChat;
    }
  })();

  return <IconComp className={cn('size-8', className)} />;
}
