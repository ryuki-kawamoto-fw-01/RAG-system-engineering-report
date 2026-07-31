---
description:"TypeScript向けコーディング規約"
applyTo: "/frontend/**/**.ts, /frontend/**/**.tsx"
---

## 概要
このファイルは、`frontend/src/app`ディレクトリ内のTypeScript/TypeScriptコードに適用されるコーディング規約とベストプラクティスを定義します。

## 1. コーディング規約

### 1.1 スタイルガイド
- **ESLint**: プロジェクトのESLint設定に準拠すること
- **インデント**: スペース2つを使用
- **行の長さ**: 最大100文字を推奨
- **セミコロン**: 必ず使用する
- **クォート**: シングルクォート（`'`）を優先
- **命名規則**:
  - コンポーネント名: `PascalCase` (例: `TodoApp`, `TodoFilter`)
  - 関数名: `camelCase` (例: `getDayOfWeek`, `handleClick`)
  - 定数: `UPPER_SNAKE_CASE` (例: `MAX_TODO_LENGTH`)
  - 変数名: `camelCase` (例: `todoList`, `filterType`)
  - 型/インターフェース名: `PascalCase` (例: `TodoItem`, `FilterType`)
  - プライベートメソッド/プロパティ: 先頭にアンダースコア (例: `_internalMethod`)

### 1.2 インポート
- React関連、サードパーティライブラリ、ローカルモジュールの順に並べる
- 各グループは空行で区切る
- 相対インポートよりも絶対インポート（エイリアス）を優先

```typescript
// React関連
import React, { useState, useEffect } from 'react';

// サードパーティライブラリ
import dayjs from 'dayjs';

// ローカルモジュール（型）
import type { TodoItem, FilterType } from '@/types';

// ローカルモジュール（コンポーネント）
import { TodoInput } from '@/components/list';
import { formatDate } from '@/lib/dateUtils';
```

---

## 2. ドキュメント

### 2.1 ファイルドキュメント
- ファイルの先頭にモジュールの説明を記載
- 最終更新日、最終更新者、目的を明記

```typescript
/**
 * 最終更新日：2025-12-26
 *
 * Todoアプリケーションのメインコンポーネント
 *
 * Todoの追加、削除、フィルタリング機能を提供します。
 */
```

### 2.2 関数・メソッドのドキュメント
- すべての公開関数とメソッドにJSDocコメントを記載
- 複雑なロジックを持つ関数には必ず説明を追加
- パラメータ、戻り値、例外を明記

```typescript
/**
 * 曜日を取得する関数
 *
 * @param year - 年（例: 2025）
 * @param month - 月（1-12）
 * @param day - 日（1-31）
 * @returns 曜日を表す文字列（'日', '月', '火', '水', '木', '金', '土'）
 * @throws {Error} 無効な日付が指定された場合
 *
 * @example
 * ```typescript
 * const dayOfWeek = getDayOfWeek(2025, 1, 5); // '日'
 * ```
 */
export function getDayOfWeek(year: number, month: number, day: number): string {
  // 実装
}
```

### 2.3 コンポーネントのドキュメント
- コンポーネントの目的と責務を明記
- Propsの説明を記載

```typescript
/**
 * Todoフィルターコンポーネント
 *
 * Todoリストの表示フィルター（すべて/アクティブ/完了）を切り替えます。
 *
 * @param props - コンポーネントのProps
 * @param props.currentFilter - 現在のフィルタータイプ
 * @param props.onFilterChange - フィルター変更時のコールバック
 */
export const TodoFilter: React.FC<TodoFilterProps> = ({ currentFilter, onFilterChange }) => {
  // 実装
};
```

---

## 3. 型システム

### 3.1 型アノテーション
- すべての関数の引数と戻り値に型を明示
- `any` の使用は極力避け、`unknown` または適切な型を使用
- 型推論が明確な場合を除き、明示的に型を指定

```typescript
// 良い例
function processData(items: string[], config?: Record<string, unknown>): Map<string, number> {
  // 実装
}

// 悪い例（anyの使用）
function processData(items: any, config?: any): any {
  // 実装
}
```

### 3.2 型定義
- 型定義は `types/` ディレクトリに配置
- インターフェースより型エイリアスを優先（拡張が必要な場合はインターフェース）
- Props型は `ComponentNameProps` の命名規則に従う

```typescript
// types/todo.ts
export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
};

export type FilterType = 'all' | 'active' | 'completed';

// コンポーネントのProps型
export type TodoItemProps = {
  todo: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};
```

### 3.3 ジェネリクス
- 再利用可能な型やコンポーネントにはジェネリクスを活用

```typescript
type ApiResponse<T> = {
  data: T;
  error?: string;
  status: number;
};

function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  // 実装
}
```

---

## 4. Reactコンポーネント

### 4.1 関数コンポーネント
- 関数コンポーネントを使用（クラスコンポーネントは避ける）
- アロー関数よりも関数宣言を優先（エクスポートの明確性のため）

```typescript
// 良い例
export function TodoApp(): JSX.Element {
  return <div>...</div>;
}

// または
export const TodoApp: React.FC = () => {
  return <div>...</div>;
};
```

### 4.2 Hooks
- Hooksはコンポーネントのトップレベルで呼び出す
- カスタムフックは `use` プレフィックスを付ける
- 依存配列は正確に指定

```typescript
function useTodoList(initialTodos: TodoItem[]) {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);

  useEffect(() => {
    // 副作用の処理
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos]); // 依存配列を正確に指定

  return { todos, setTodos };
}
```

### 4.3 コンポーネントの構造
1. Props型定義
2. コンポーネント定義
3. State定義（useState）
4. Effectフック（useEffect）
5. イベントハンドラー
6. レンダリングロジック

```typescript
type TodoAppProps = {
  initialTodos?: TodoItem[];
};

export function TodoApp({ initialTodos = [] }: TodoAppProps): JSX.Element {
  // State
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [filter, setFilter] = useState<FilterType>('all');

  // Effects
  useEffect(() => {
    // 初期化処理
  }, []);

  // イベントハンドラー
  const handleAddTodo = (text: string) => {
    // 実装
  };

  const handleToggleTodo = (id: string) => {
    // 実装
  };

  // レンダリング
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

---

## 5. エラーハンドリング

### 5.1 例外処理
- try-catchで適切にエラーをハンドリング
- ユーザーフレンドリーなエラーメッセージを提供

```typescript
async function fetchTodos(): Promise<TodoItem[]> {
  try {
    const response = await fetch('/api/todos');

    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Todoの取得に失敗しました:', error);
    throw new Error('Todoの取得に失敗しました。後でもう一度お試しください。');
  }
}
```

### 5.2 バリデーション
- 入力値は必ずバリデーション
- 早期リターンでエラーケースを処理

```typescript
function validateTodoText(text: string): boolean {
  if (!text || text.trim().length === 0) {
    throw new Error('Todoのテキストを入力してください');
  }

  if (text.length > MAX_TODO_LENGTH) {
    throw new Error(`Todoは${MAX_TODO_LENGTH}文字以内で入力してください`);
  }

  return true;
}
```

---

## 6. パフォーマンス

### 6.1 メモ化
- 重い計算結果は `useMemo` でメモ化
- コールバック関数は `useCallback` でメモ化
- コンポーネントは必要に応じて `React.memo` でメモ化

```typescript
export const TodoList = React.memo<TodoListProps>(({ todos, onToggle, onDelete }) => {
  // フィルタリングされたTodoリストをメモ化
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      // フィルタリングロジック
    });
  }, [todos, filter]);

  // コールバックをメモ化
  const handleToggle = useCallback((id: string) => {
    onToggle(id);
  }, [onToggle]);

  return <div>{/* レンダリング */}</div>;
});
```

### 6.2 遅延読み込み
- 大きなコンポーネントは `React.lazy` で遅延読み込み
- `Suspense` でローディング状態を管理

```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export function App() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

---

## 7. テスト

### 7.1 テストコードは作成しない
- このプロジェクトでは、原則テストコードの自動生成は行わない
- 例外として、ユーザプロンプトやシステムプロンプトで明示的にテストコードの生成を指示された場合のみ作成する

### 7.2 テスタビリティ
- テストしやすいコードを書く
- ビジネスロジックはコンポーネントから分離
- 純粋関数を優先

```typescript
// 良い例：ビジネスロジックを分離
export function filterTodos(todos: TodoItem[], filter: FilterType): TodoItem[] {
  switch (filter) {
    case 'active':
      return todos.filter(todo => !todo.completed);
    case 'completed':
      return todos.filter(todo => todo.completed);
    default:
      return todos;
  }
}

// コンポーネント内で使用
const filteredTodos = filterTodos(todos, currentFilter);
```

---

## 8. Next.js固有のベストプラクティス

### 8.1 App Router
- App Routerを使用（Pages Routerは避ける）
- Server ComponentsとClient Componentsを適切に使い分け
- `'use client'` ディレクティブは必要な場合のみ使用

```typescript
// app/page.tsx (Server Component)
export default function Page() {
  // サーバーサイドで実行
  return <ClientComponent />;
}

// components/ClientComponent.tsx
'use client';

export function ClientComponent() {
  // クライアントサイドで実行
  const [state, setState] = useState();
  return <div>...</div>;
}
```

### 8.2 データフェッチング
- Server Componentsでのデータフェッチングを優先
- クライアントサイドでは `useEffect` よりもReact Queryなどのライブラリを検討

```typescript
// Server Component
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // 1時間キャッシュ
  });
  return res.json();
}

export default async function Page() {
  const data = await getData();
  return <div>{data.title}</div>;
}
```

### 8.3 画像最適化
- `next/image` の `Image` コンポーネントを使用
- 適切な `width`、`height`、`alt` を指定

```typescript
import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="ロゴ"
      width={200}
      height={100}
      priority
    />
  );
}
```

---

## 9. スタイリング

### 9.1 CSS Modules / Tailwind CSS
- CSS ModulesまたはTailwind CSSを使用
- インラインスタイルは動的スタイルのみに限定

```typescript
// Tailwind CSSの例
export function Button({ children, variant = 'primary' }: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = variant === 'primary'
    ? 'bg-blue-500 text-white hover:bg-blue-600'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  return (
    <button className={`${baseClasses} ${variantClasses}`}>
      {children}
    </button>
  );
}
```

### 9.2 レスポンシブデザイン
- モバイルファーストで設計
- Tailwindのブレークポイントを活用

---

## 10. セキュリティ

### 10.1 XSS対策
- ユーザー入力は必ずエスケープ
- `dangerouslySetInnerHTML` の使用は避ける
- 外部入力をそのまま表示しない

```typescript
// 良い例：Reactが自動エスケープ
<div>{userInput}</div>

// 悪い例
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 10.2 環境変数
- 機密情報は環境変数で管理
- クライアントサイドで使用する環境変数には `NEXT_PUBLIC_` プレフィックスを付ける

```typescript
// 良い例
const apiKey = process.env.API_KEY; // サーバーサイドのみ
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL; // クライアントでも使用可能
```

---

## 11. コメント

### 11.1 日本語コメント
- すべてのコメントは日本語で記載
- 初心者エンジニアにも理解できるよう、丁寧に説明

### 11.2 コメントのベストプラクティス
- なぜそのコードを書いたのか（Why）を説明
- 何をするか（What）はコード自体で表現
- 複雑なロジックには必ずコメントを付ける

```typescript
// 良い例：理由を説明
// パフォーマンス向上のため、フィルタリング結果をメモ化
const filteredTodos = useMemo(() => filterTodos(todos, filter), [todos, filter]);

// 悪い例：自明なことを説明
// countに1を足す
const newCount = count + 1;
```

---

## 12. ファイル構成

### 12.1 ディレクトリ構造
```
frontend/src/app
├── api/                         # Next.js App Router
│   └── [機能と関連したフォルダ名]
│       └── route.ts             # APIエンドポイント（バックエンド連携）
├── (dashboard)/
|    └──[機能と関連したフォルダ名]/
|       ├── _actions/            # 機能別のアクション関数
|       ├── _components/         # 機能別のコンポーネント
|       ├── page.tsx             # ページコンポーネント
|       └── layout.tsx           # 汎用コンポーネント
└── _utils/                      # UI関連のユーティリティ関数
```

### 12.2 ファイルの命名規則
- コンポーネントファイル: `PascalCase.tsx` (例: `TodoApp.tsx`)
- ユーティリティファイル: `camelCase.ts` (例: `dateUtils.ts`)
- 型定義ファイル: `camelCase.ts` (例: `todo.ts`)
- テストファイル: `*.test.ts` または `*.test.tsx`

---

## 13. その他のベストプラクティス

### 13.1 マジックナンバー/文字列を避ける
```typescript
// 良い例
const MAX_TODO_LENGTH = 100;
const todoText = input.slice(0, MAX_TODO_LENGTH);

// 悪い例
const todoText = input.slice(0, 100);
```

### 13.2 関数は小さく保つ
- 1つの関数は1つのことをする
- 関数の行数は30行以内を目安に
- 複雑な関数は小さな関数に分割

### 13.3 早期リターン
- ネストを減らすために早期リターンを使用

```typescript
function processTodo(todo: TodoItem | null): string {
  if (!todo) {
    return '';
  }

  if (!todo.text) {
    return '';
  }

  // メイン処理
  return todo.text.trim();
}
```

### 13.4 オプショナルチェーン
- ネストしたプロパティアクセスには `?.` を使用

```typescript
// 良い例
const userName = user?.profile?.name ?? 'ゲスト';

// 悪い例
const userName = user && user.profile && user.profile.name || 'ゲスト';
```

### 13.5 分割代入
- オブジェクトや配列から値を取り出す際は分割代入を使用

```typescript
// 良い例
const { id, text, completed } = todo;
const [first, second, ...rest] = items;

// 悪い例
const id = todo.id;
const text = todo.text;
const completed = todo.completed;
```

---

## 14. アクセシビリティ

### 14.1 セマンティックHTML
- 適切なHTML要素を使用
- `<div>` や `<span>` の乱用を避ける

```typescript
// 良い例
<button onClick={handleClick}>クリック</button>
<nav>
  <ul>
    <li><a href="/">ホーム</a></li>
  </ul>
</nav>

// 悪い例
<div onClick={handleClick}>クリック</div>
```

### 14.2 ARIA属性
- 必要に応じてARIA属性を追加
- `aria-label`、`aria-describedby` などを適切に使用

```typescript
<button
  aria-label="Todoを削除"
  onClick={() => handleDelete(todo.id)}
>
  ×
</button>
```

### 14.3 キーボード操作
- すべてのインタラクティブ要素はキーボードで操作可能にする
- フォーカス管理を適切に行う

---
