import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// clsxを使用しクラス名を結合し、Tailwind CSSのユーティリティクラスをtailwind-mergeを通じてマージする関数。
// 任意の数のクラス名をclsxで連結し、tailwind-mergeのtwMergeを用いてTailwind CSSのユーティリティクラスを賢くマージする。
// これにより、類似の目的を持つユーティリティクラス（例えば、マージンやパディングクラス）が組み合わされた場合でも、
// 最も関連性の高いクラスのみが適用され、衝突や予期せぬ挙動を防ぐ。
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
