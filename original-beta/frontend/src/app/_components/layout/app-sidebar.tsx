'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { SVGProps, useState } from 'react';
import { isRouteDisabled } from '../../../disabledRoutes';
import SvgChevronDown from '../icon/button/ChevronDown';
import SvgGraph from '../icon/decorative/Graph';
import SvgChat from '../icon/sidebar/Chat';
import SvgCommon from '../icon/sidebar/Common';
import SvgFile from '../icon/sidebar/File';
import SvgHamburger from '../icon/sidebar/Hamburger';
import SvgHome from '../icon/sidebar/Home';
import SvgIt from '../icon/sidebar/It';
import SvgManufacture from '../icon/sidebar/Manufacture';
import SvgPlanning from '../icon/sidebar/Planning';
import SvgPrompt from '../icon/sidebar/Prompt';
import SvgRegister from '../icon/sidebar/Register';
import SearchBox from '../search-box';
//import SvgUsecase from '../icon/sidebar/Usecase';
import Beta from '../ui/beta';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from '../ui/sidebar';

// type ChildItem = {
//   title: string;
//   url: string;
//   isBeta: boolean;
// };

// type Item = {
//   title: string;
//   url: string;
//   icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
//   children?: ChildItem[];
// };

type SidebarItem = {
  title: string;
  url?: string;
  icon?: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
  isBeta?: boolean;
  children?: SidebarItem[];
};

// リンク一覧
const items: SidebarItem[] = [
  {
    title: 'ホーム',
    url: '/',
    icon: SvgHome,
  },
  // {
  //   title: 'AI Agent',
  //   url: '/agent/rag',
  //   icon: SvgAgent,
  // },
  // {
  //   title: 'ユースケース検索',
  //   url: '/use-case-search',
  //   icon: SvgUsecase,
  // },
  {
    title: 'チャット',
    url: '/chat',
    icon: SvgChat,
  },
  // {
  //   title: '音声入力',
  //   url: '/voice-input',
  //   icon: SvgAudio,
  // },
  {
    title: '文書問い合わせ',
    url: '#',
    icon: SvgFile,
    children: [
      {
        title: '文書検索',
        url: '/rag-chat',
        isBeta: false,
      },
      {
        title: '文書登録',
        url: '/document-register',
        isBeta: false,
      },
      {
        title: '辞書登録',
        url: '/dictionary',
        isBeta: false,
      },
      {
        title: 'Q&A登録',
        url: '/qa',
        isBeta: false,
      },
    ],
  },
  {
    title: 'プロンプト',
    url: '#',
    icon: SvgPrompt,
    children: [
      {
        title: 'プロンプト作成',
        url: '/create-prompt',
        isBeta: false,
      },
      {
        title: 'プロンプト登録',
        url: '/template-register',
        isBeta: false,
      },
    ],
  },
  {
    title: '汎用業務',
    url: '#',
    icon: SvgCommon,
    children: [
      {
        title: 'アイデア出し',
        url: '/create-idea',
        isBeta: false,
      },
      {
        title: '企業調査',
        url: '/corporate-survey',
        isBeta: false,
      },
      {
        title: '議事録',
        url: '/create-minutes',
        isBeta: false,
      },
      {
        title: '企業分析',
        url: '/company-analysis',
        isBeta: false,
      },
      {
        title: '想定質問',
        url: '/supposed-question',
        isBeta: false,
      },
      {
        title: 'トークスクリプト',
        url: '/talk-script',
        isBeta: false,
      },
      {
        title: '文章校正',
        url: '/text-correction',
        isBeta: false,
      },
      {
        title: '翻訳',
        url: '/translation',
        isBeta: false,
      },
      {
        title: 'メール作成',
        url: '/create-mail',
        isBeta: false,
      },
      {
        title: '要約',
        url: '/summary',
        isBeta: false,
      },
      {
        title: 'ニーズ調査',
        url: '/needs-survey',
        isBeta: true,
      },
      {
        title: '業務のタスク分解',
        url: '/task-breakdown',
        isBeta: true,
      },
      {
        title: '課題解決アドバイザー',
        url: '/problem-solving-advisor',
        isBeta: true,
      },
      {
        title: 'ブレインストーミング',
        url: '/brainstorming',
        isBeta: true,
      },
      {
        title: '文章の要点抽出',
        url: '/key-point-extraction',
        isBeta: true,
      },
      {
        title: 'スケジュール作成',
        url: '/create-schedule',
        isBeta: true,
      },
      {
        title: '文章内容チェック',
        url: '/text-check',
        isBeta: true,
      },
      {
        title: '専門用語の解説と文章要約',
        url: '/term-summary',
        isBeta: true,
      },
      {
        title: 'アドバイス（ReAct）',
        url: '/advice-react',
        isBeta: true,
      },
      {
        title: 'アドバイス（Consulting）',
        url: '/advice-consulting',
        isBeta: true,
      },
      {
        title: '思考の壁打ち',
        url: '/wall-hitting',
        isBeta: true,
      },
    ],
  },
  {
    title: '企画・設計',
    url: '#',
    icon: SvgPlanning,
    children: [
      {
        title: '市場アイデア創出',
        url: '/new-product-idea',
        isBeta: true,
      },
      {
        title: '製品キャッチコピー',
        url: '/product-catchphrase',
        isBeta: true,
      },
      {
        title: '製品ネーミング',
        url: '/create-product-name',
        isBeta: true,
      },
      {
        title: '法律準拠判断',
        url: '/compliance-judge',
        isBeta: true,
      },
      {
        title: '市場調査レポート',
        url: '/market-research-report',
        isBeta: true,
      },
      {
        title: 'ユーザ価値創出アイデア',
        url: '/product-service-benefit-idea',
        isBeta: true,
      },
      {
        title: 'AARRR分析',
        url: '/product-aarrr',
        isBeta: true,
      },
    ],
  },
  {
    title: '開発',
    url: '#',
    icon: SvgIt,
    children: [
      {
        title: 'CVE情報検索',
        url: '/cve-search',
        isBeta: true,
      },
      {
        title: 'ソースコード作成',
        url: '/source-code-creation',
        isBeta: true,
      },
      {
        title: 'コード解説',
        url: '/code-explanation',
        isBeta: true,
      },
      {
        title: 'エラー解析',
        url: '/error-analysis',
        isBeta: true,
      },
    ],
  },
  {
    title: '製造',
    url: '#',
    icon: SvgManufacture,
    children: [
      {
        title: 'データ分析',
        url: '/analysis',
        isBeta: true,
      },
      {
        title: '設計書レビュー',
        url: '/design-document-review',
        isBeta: true,
      },
      {
        title: '危機管理シナリオ',
        url: '/crisis-management-scenarios',
        isBeta: true,
      },
      {
        title: 'リスクアセスメント',
        url: '/risk-assessment',
        isBeta: true,
      },
      {
        title: '製品比較',
        url: '/product-comparison-table',
        isBeta: true,
      },
      {
        title: '品質基準書の作成',
        url: '/quality-standard-document',
        isBeta: true,
      },
      {
        title: '技術トレーニング計画',
        url: '/technology-training',
        isBeta: true,
      },
      {
        title: '技術評価レポート',
        url: '/techassess',
        isBeta: true,
      },
      {
        title: '工程管理表の作成',
        url: '/flow-designer',
        isBeta: true,
      },
      {
        title: '新技術導入提案書の作成',
        url: '/create-technology-proposal',
        isBeta: true,
      },
      {
        title: 'トラブルシューティング',
        url: '/trouble-shooting',
        isBeta: true,
      },
      {
        title: '労働災害報告書',
        url: '/incident-report',
        isBeta: true,
      },
      {
        title: '品質管理レポート',
        url: '/quality-report',
        isBeta: true,
      },
      {
        title: '技術レポート作成',
        url: '/technology-trend-research',
        isBeta: true,
      },
    ],
  },
  {
    title: '営業',
    url: '#',
    icon: SvgGraph,
    children: [
      {
        title: 'FAQ作成',
        url: '/faq-creation',
        isBeta: true,
      },
      {
        title: 'マーケティング戦略',
        url: '/marketing-strategy',
        isBeta: true,
      },
      {
        title: '製品の拡販戦略',
        url: '/product-promotion-strategy',
        isBeta: true,
      },
    ],
  },
  {
    title: '各種登録',
    url: '#',
    icon: SvgRegister,
    children: [
      {
        title: '禁止ワード登録',
        url: '/ban-word',
        isBeta: false,
      },
      // {
      //   title: 'ヒヤリハット登録',
      //   url: '/hiyari-hat-kyt-register',
      //   isBeta: true,
      // },
    ],
  },
  {
    title: 'α版(検証中)',
    url: '#',
    icon: SvgIt,
    children: [
      {
        title: '規格/設計書登録',
        url: '/standard-register',
        isBeta: false,
      },
      {
        title: '設計書チェック',
        url: '/document-check',
        isBeta: false,
      },
      {
        title: '規格検索',
        url: '/agent/specification',
        isBeta: false,
      },
      // {
      //   title: '事業計画書の作成',
      //   url: '/business-plan',
      //   isBeta: false,
      // },
      // // {
      //   title: '研究報告書の作成',
      //   url: '/research-report',
      //   isBeta: false,
      // },
      // {
      //   title: '不具合分析レポート',
      //   url: '/defect-analysis-report',
      //   isBeta: false,
      // },
      // {
      //   title: '販売予測分析',
      //   url: '/sales-forecast',
      //   isBeta: false,
      // },
      // {
      //   title: '生産技術の洗い出し',
      //   url: '/production-tech-list',
      //   isBeta: false,
      // },
      {
        title: '新製品企画書',
        url: '/new-product-proposal',
        isBeta: false,
      },
      // {
      //   title: '手書きメモの文字起こし',
      //   url: '/transcription-handwritten',
      //   isBeta: false,
      // },
      {
        title: '動画から簡単にマニュアル作成',
        url: '/create-manual',
        isBeta: false,
      },
      {
        title: '画像生成',
        url: '/image-generation',
        isBeta: false,
      },
    ],
  },
  // {
  //   title: 'Deep Research',
  //   url: '/deep-research',
  //   icon: SvgUsecase,
  // },
];

// フッターリンク一覧
const footerItems = [
  {
    title: '利用規約',
    url: '/terms-of-service',
  },
];

// メニュー項目がアクティブかどうかを判定する関数
function isMenuItemActive(pathname: string, itemUrl: string | undefined): boolean {
  if (!itemUrl) return false;

  // 完全一致の場合はアクティブ
  if (pathname === itemUrl) return true;

  // ホーム('/') の場合は完全一致のみ
  if (itemUrl === '/') return false;

  // その他のパスは前方一致でアクティブ判定
  return pathname.startsWith(itemUrl);
}

// 検索ワードに基づいてメニューアイテムをフィルタリングする関数
function filterItemsBySearch(items: SidebarItem[], searchTerm: string): SidebarItem[] {
  if (!searchTerm.trim()) return items;

  const lowerSearch = searchTerm.toLowerCase();

  return items
    .map((item) => {
      // タイトルがマッチする場合は全体を返す
      if (item.title.toLowerCase().includes(lowerSearch)) {
        return item;
      }

      // 子要素がある場合は再帰的にフィルタ
      if (item.children) {
        const filteredChildren = filterItemsBySearch(item.children, searchTerm);
        if (filteredChildren.length > 0) {
          return { ...item, children: filteredChildren };
        }
      }

      return null;
    })
    .filter(Boolean) as SidebarItem[];
}

function renderSidebarItems(
  items: SidebarItem[],
  pathname: string,
  open: boolean,
  level: number = 0,
  searchTerm: string = ''
) {
  return items.map((item) => {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;

    // 最下層（リンクのみ、またはtitle表示のみ）
    if (!hasChildren) {
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            isActive={isMenuItemActive(pathname, item.url)}
            tooltip={open ? '' : item.title}
            asChild={!!item.url}
            className="h-auto min-h-10 py-2 [&>a>span:last-child]:whitespace-normal [&>a>span:last-child]:break-words [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words"
          >
            {item.url ? (
              <Link href={item.url}>
                <span>{item.icon && <item.icon className="size-6" />}</span>
                <span className="whitespace-normal break-words">{item.title}</span>
                {item.isBeta && <Beta />}
              </Link>
            ) : (
              <span>
                <span>{item.icon && <item.icon className="size-6" />}</span>
                <span className="whitespace-normal break-words">{item.title}</span>
                {item.isBeta && <Beta />}
              </span>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    // 子あり
    const groupClassName =
      level === 0
        ? 'group/collapsible-0'
        : level === 1
          ? 'group/collapsible-1'
          : 'group/collapsible-2';
    const chevronClassName =
      level === 0
        ? 'transition-transform group-data-[state=open]/collapsible-0:rotate-180'
        : level === 1
          ? 'transition-transform group-data-[state=open]/collapsible-1:rotate-180'
          : 'transition-transform group-data-[state=open]/collapsible-2:rotate-180';

    // 検索時またはパスがマッチする場合は開く
    const shouldOpen =
      !!searchTerm ||
      item.children!.some(
        (child) =>
          (child.url && pathname.startsWith(child.url)) ||
          (child.children &&
            child.children.some((gchild) => !!gchild.url && pathname.startsWith(gchild.url)))
      );

    return open ? (
      // アコーディオンの子メニュー
      <Collapsible key={item.title} defaultOpen={shouldOpen} className={groupClassName}>
        <SidebarMenuItem>
          <CollapsibleTrigger className="w-full">
            <SidebarMenuButton
              tooltip={open ? '' : item.title}
              className="h-auto min-h-10 py-2 [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words"
            >
              <span>{item.icon && <item.icon className="size-6" />}</span>
              <span className="flex-1 whitespace-normal break-words text-left">{item.title}</span>
              <SvgChevronDown className={chevronClassName} />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub
              className="gap-0 border-none p-0"
              style={{ paddingLeft: `${(level + 1) * 4}px` }}
            >
              {renderSidebarItems(item.children!, pathname, open, level + 1, searchTerm)}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    ) : (
      // ドロップダウンの子メニュー
      <DropdownMenu key={item.title}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={item.children!.some(
                (childItem) =>
                  (childItem.url && pathname.startsWith(childItem.url)) ||
                  (childItem.children &&
                    childItem.children.some(
                      (gchild) => !!gchild.url && pathname.startsWith(gchild.url)
                    ))
              )}
              tooltip={item.title}
            >
              <span>{item.icon && <item.icon className="size-6" />}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          className="max-h-[70vh] min-w-[160px] overflow-auto"
        >
          {item.children!.map((childItem) =>
            !childItem.children ? (
              childItem.url ? (
                <DropdownMenuItem key={childItem.title} className="h-9 text-sm font-medium" asChild>
                  <Link href={childItem.url}>
                    <span>{childItem.title}</span>
                    {childItem.isBeta && <Beta />}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  key={childItem.title}
                  className="h-9 cursor-default text-sm font-medium"
                  disabled
                >
                  <span>{childItem.title}</span>
                  {childItem.isBeta && <Beta />}
                </DropdownMenuItem>
              )
            ) : (
              // 子要素を持つ項目：子要素を全て展開（見出しなし）
              <React.Fragment key={childItem.title}>
                {childItem.children.map((grandChild) => (
                  <DropdownMenuItem
                    key={`${childItem.title}-${grandChild.title}`}
                    className="h-9 text-sm font-medium"
                    asChild
                  >
                    <Link href={grandChild.url || '#'}>
                      <span>{grandChild.title}</span>
                      {grandChild.isBeta && <Beta />}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </React.Fragment>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  });
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { open, toggleSidebar } = useSidebar();
  const [searchTerm, setSearchTerm] = useState('');

  // 子要素を持つ場合は残った子がなければ親も非表示
  const filteredItems = items
    .map((item) => {
      if (item.children) {
        const filteredChildren = item.children.filter((c) => !isRouteDisabled(c.url ?? ''));
        return filteredChildren.length > 0 ? { ...item, children: filteredChildren } : null;
      }
      return isRouteDisabled(item.url ?? '') ? null : item;
    })
    .filter(Boolean) as SidebarItem[];

  // 検索でフィルタリング
  const searchFilteredItems = filterItemsBySearch(filteredItems, searchTerm);

  const filteredFooterItems = footerItems.filter((f) => !isRouteDisabled(f.url));

  return (
    <Sidebar
      collapsible="icon"
      className="border-slate-200 bg-sky-50 px-2 pb-3 pt-2 shadow-sidebar"
    >
      {/* サイドバーヘッダー */}
      <SidebarHeader className="items-end p-0 group-data-[collapsible=icon]:items-center">
        <Button variant="icon" size="icon" onClick={toggleSidebar} className="hover:bg-white">
          <SvgHamburger className="size-8" />
        </Button>
      </SidebarHeader>

      {/* 検索ボックス - サイドバーが開いている時のみ表示 */}
      {open && (
        <div className="mt-2 px-2">
          <SearchBox
            placeholder="メニューを検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* サイドバーコンテンツ */}
      <SidebarContent className="mt-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {renderSidebarItems(searchFilteredItems, pathname, open, 0, searchTerm)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* サイドバーフッター */}
      <SidebarFooter className="mt-2 p-0 group-data-[collapsible=icon]:hidden">
        <SidebarMenu className="gap-y-2">
          {filteredFooterItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className="h-[18px] px-2 py-0 text-xs font-normal hover:bg-inherit"
              >
                <Link href={item.url}>{item.title}</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
