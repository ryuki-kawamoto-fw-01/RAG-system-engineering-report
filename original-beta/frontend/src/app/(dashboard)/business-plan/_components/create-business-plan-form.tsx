'use client';

import { Loader2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setBusinessPlan } from '@/app/_store/slice/business-plan';
import { cn } from '@/app/_utils/tw-merge';
import { BusinessPlanSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function CreateBusinessPlanForm({ className }: Props) {
  const {
    onChangeField,
    control,
    formState: { isValid, isSubmitting },
  } = useFormReduxContext<BusinessPlanSchema>({
    setRedux: setBusinessPlan,
  });

  return (
    <div className={cn('flex h-full flex-col relative', className)}>
      <div className="h-full space-y-3 overflow-y-auto pb-[52px]">
        <div>
          <div className="mb-3">
            <FormField
              control={control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>事業名</RequiredLabel>
                  <Textarea
                    {...field}
                    className="min-h-[61px] w-full border-neutral-100"
                    placeholder="例：SmartStock AI（スマートストック・エーアイ）"
                    onBlur={(e) => {
                      onChangeField({ businessName: e.target.value });
                    }}
                    showCounter
                    // maxLength={10000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mb-3">
            <FormField
              control={control}
              name="businessPurpose"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>事業の目的・背景・解決する課題</RequiredLabel>
                  <Textarea
                    {...field}
                    className="min-h-[183px] w-full border-neutral-100"
                    placeholder="例：中小小売・EC事業者が抱える在庫過多・欠品による機会損失とキャッシュフロー悪化を解消するため、需要予測と自動発注を支援し在庫回転率と粗利を改善する。"
                    onBlur={(e) => {
                      onChangeField({ businessPurpose: e.target.value });
                    }}
                    showCounter
                    // maxLength={10000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mb-3">
            <FormField
              control={control}
              name="targetMarket"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>ターゲット市場・顧客層</RequiredLabel>
                  <Textarea
                    {...field}
                    className="min-h-[183px] w-full border-neutral-100"
                    placeholder="例：年商1〜50億円規模の小売・D2C・EC事業者／SKU数が多く需要変動が大きいカテゴリー（アパレル、コスメ、日用品）を中心とした在庫担当者・サプライチェーン責任者。"
                    onBlur={(e) => {
                      onChangeField({ targetMarket: e.target.value });
                    }}
                    showCounter
                    // maxLength={10000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mb-3">
            <FormField
              control={control}
              name="businessModel"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>収益モデル・事業の仕組み</RequiredLabel>
                  <Textarea
                    {...field}
                    className="min-h-[183px] w-full border-neutral-100"
                    placeholder="例：サブスクリプション（月額課金：SKU数・店舗数・ユーザー数に応じた従量プラン）＋初期導入費（データ連携・チューニング）＋オプション（需要予測API、コンサルティング）。"
                    onBlur={(e) => {
                      onChangeField({ businessModel: e.target.value });
                    }}
                    showCounter
                    // maxLength={10000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mb-3">
            <FormField
              control={control}
              name="competitiveAdvantage"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>競合優位性・独自性</RequiredLabel>
                  <Textarea
                    {...field}
                    className="min-h-[183px] w-full border-neutral-100"
                    placeholder="例：POS/EC/広告データを統合した独自需要予測モデルにより、季節性・プロモーション・天候の影響を高精度に反映。導入3週間で稼働可能なコネクタ群、ダッシュボードの即時可視化、実績ベースで平均在庫20％削減・欠品30％減を達成したユースケース。"
                    onBlur={(e) => {
                      onChangeField({ competitiveAdvantage: e.target.value });
                    }}
                    showCounter
                    // maxLength={10000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mb-3">
            <FormField
              control={control}
              name="financialProjection"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>財務計画・収支予測</RequiredLabel>
                  <Textarea
                    {...field}
                    className="min-h-[183px] w-full border-neutral-100"
                    placeholder="例：初年度は導入基盤整備とセールス体制構築に注力しARR 6,000万円、営業赤字2,000万円。2年目ARR 2.0億円で損益分岐到達、3年目ARR 4.5億円・営業利益6,000万円を見込む。CAC回収期間12カ月、グロスマージン80％、チャーン年率5％想定。"
                    onBlur={(e) => {
                      onChangeField({ financialProjection: e.target.value });
                    }}
                    showCounter
                    // maxLength={10000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button
          type="submit"
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
          variant="secondary"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : '事業計画書を作成する'}
        </Button>
      </div>
    </div>
  );
}
