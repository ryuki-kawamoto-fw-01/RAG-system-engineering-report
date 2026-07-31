'use client';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';
import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { setResult } from '@/app/_store/slice/sales-forecast';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import { useAppDispatch, useAppSelector } from '../../_store/hooks';
import ActionButtons from './_components/action-buttons';
import EnhancedDisplay from './_components/enhanced-display';
import InputForm from './_components/input-form';
import ModifyForm from './_components/modify-form';
import SalesForecastTitle from './_components/salesForecast-title';

export default function Layout() {
  const [isEditing, setIsEditing] = useState(false);
  const [preEditEnhancedSalesForecast, setPreEditEnhancedSalesForecast] = useState('');
  const dispatch = useAppDispatch();
  const { result, feedbackAt } = useAppSelector((state) => state.salesForecast);
  const [isSalesForecast, setIsSalesForecast] = useState(false);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  useEffect(() => {
    setPreEditEnhancedSalesForecast(result);
  }, [result]);

  const handleEditChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPreEditEnhancedSalesForecast(e.target.value);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setPreEditEnhancedSalesForecast(result);
  };

  const handleCancel = () => {
    setPreEditEnhancedSalesForecast(result);
    setIsEditing(false);
  };

  const handleSave = () => {
    dispatch(setResult({ result: preEditEnhancedSalesForecast, feedbackAt }));
    setIsEditing(false);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(result);
    toast.success(getMessage('I_F_00050', '作成結果'));
  };

  return (
    <PageLayout className="flex flex-col">
      <SalesForecastTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {(isLeftOnly || isTwoColumns) && (
          <InputForm
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
            setIsSalesForecast={setIsSalesForecast}
            switchLayout={switchLayout}
          />
        )}
        {(isRightOnly || isTwoColumns) && (
          <div className={cn('w-full flex flex-col relative', isTwoColumns && 'w-2/3 min-h-0')}>
            <div className="h-full overflow-y-auto">
              <div className="h-[calc(100%+48px)]">
                <div className="flex h-[calc((100%-48px)*4/5)] flex-col">
                  <ActionButtons
                    isEditing={isEditing}
                    handleEdit={handleEdit}
                    handleCancel={handleCancel}
                    handleSave={handleSave}
                    preEditContent={preEditEnhancedSalesForecast}
                  />
                  <EnhancedDisplay
                    isEditing={isEditing}
                    onChange={handleEditChange}
                    result={preEditEnhancedSalesForecast}
                    handleCopy={copyMessage}
                    className="mb-3 mt-1"
                    isSubmitting={isSalesForecast}
                  />
                </div>
                <ModifyForm className="h-[calc((100%-48px)/5)]" switchLayout={switchLayout} />
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
