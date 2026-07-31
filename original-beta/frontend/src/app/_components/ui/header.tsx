'use server';

// import Image from 'next/image';
import Link from 'next/link';
import { getCurrentUser } from '@/app/_utils/auth';
import { cn } from '@/app/_utils/tw-merge';
// import { title } from '../../../../config';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

type Props = {
  className?: string;
};

export default async function Header({ className }: Props) {
  const user = await getCurrentUser();
  const DEFAULT_ICON_URL = '/images/icons/header/user-default.svg';
  return (
    <header
      className={cn(
        'z-50 flex h-12 w-full items-center justify-between bg-white pl-5 pr-10 shadow-header',
        className
      )}
    >
      {/* ロゴ */}
      {/* トライアル環境なので修正 */}
      <Link href="/" className="flex h-full items-center">
        {/* <Image
          src="/images/icons/header/logo_horizontal_all.svg"
          width={103}
          height={32}
          alt={title}
        /> */}
        <div className="text-sm font-bold leading-[1.2rem] text-neutral-900">
          製造業向け
          <br />
          アシスタントAI
        </div>
      </Link>
      {/* 中央: お知らせリンク */}
      {/* トライアル環境なので修正 */}
      {/* <div className="absolute left-1/2 flex -translate-x-1/2 gap-3">
        <Link
          href="https://teams.microsoft.com/l/channel/19%3Ad07165c4d3534e1889a3cc4d3525c880%40thread.tacv2/01_%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B%20%F0%9F%93%A2?groupId=9db1b97d-43eb-4d70-8af7-1e6241459f4d&tenantId=f54277c9-dafe-44aa-85a4-73d5c7c52450"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-slate-500 bg-blue-50 px-4 py-1 text-sm font-bold transition-colors hover:bg-blue-100"
        >
          <span>📢</span>
          <span>最新のお知らせはこちら</span>
        </Link>
        <Link
          href="https://teams.microsoft.com/l/channel/19%3Aad84aabe4f6345c08bcff7260614de47%40thread.tacv2/04_%E4%B8%8D%E5%85%B7%E5%90%88%E9%80%A3%E7%B5%A1_%E6%A9%9F%E8%83%BD%E6%94%B9%E5%96%84%E8%A6%81%E6%9C%9B?groupId=9db1b97d-43eb-4d70-8af7-1e6241459f4d&tenantId=f54277c9-dafe-44aa-85a4-73d5c7c52450"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-slate-500 bg-blue-50 px-4 py-1 text-sm font-bold transition-colors hover:bg-blue-100"
        >
          <span>🐛</span>
          <span>不具合・改善要望の報告はこちら</span>
        </Link>
        <Link
          href="https://teams.microsoft.com/l/channel/19%3A5e1752d9dc2844a3801a4b71535059dd%40thread.tacv2/02_%E7%A4%BE%E5%93%A1%E3%82%B3%E3%83%9F%E3%83%A5%E3%83%8B%E3%83%86%E3%82%A3?groupId=9db1b97d-43eb-4d70-8af7-1e6241459f4d&tenantId=f54277c9-dafe-44aa-85a4-73d5c7c52450"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-slate-500 bg-blue-50 px-4 py-1 text-sm font-bold transition-colors hover:bg-blue-100"
        >
          <span>👥</span>
          <span>げんあしのコミュニティはこちら</span>
        </Link>
      </div> */}
      {/* 右側: 通知アイコンとアバター */}
      <div className="flex items-center gap-4">
        {/* 通知アイコン */}
        {/**
        <div className="relative">
          <Button size="icon">
            <Bell className="size-5 text-neutral-800" />
          </Button>
        </div>
        */}
        {/* アバター */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* Avatar */}
            <Avatar className="size-8 cursor-pointer">
              <AvatarImage src={DEFAULT_ICON_URL} alt="User Avatar" />
              <AvatarFallback className="rounded-full bg-neutral-100" />
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-6 rounded-xl p-1.5 shadow-lg">
            <DropdownMenuGroup className="px-1.5 pb-3">
              <DropdownMenuItem className="h-8 p-0 text-base leading-[21px] text-neutral-900 hover:bg-white">
                {user.name}
              </DropdownMenuItem>
              <DropdownMenuItem className="h-3 p-0 text-sm text-neutral-400 hover:bg-white">
                {user.email}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {/**
              <DropdownMenuGroup className='px-2.5'>
                <DropdownMenuSeparator className='py-1 border-b border-neutral-100'/>
              </DropdownMenuGroup>
              <DropdownMenuItem className="px-1">
                <Button
                  variant="icon"
                  size={"icon"}
                  className="w-full justify-start text-red-600 hover:bg-red-50 p-0"
                >
                  <Logout className="w-4 h-4 mr-1" />
                  <span className='font-normal'>ログアウト</span>
                </Button>
              </DropdownMenuItem>
            */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
