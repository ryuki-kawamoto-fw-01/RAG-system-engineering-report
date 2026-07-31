'use client';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';
import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import { useAppDispatch, useAppSelector } from '../../_store/hooks';
import { selectCreateMinutes } from '../../_store/selectors/create-minutes';
import { setResult } from '../../_store/slice/create-minutes';
import { downloadMinutesFormat } from './_actions/downloadFormat';
import ActionButtons from './_components/action-buttons';
import CreateMinutesTitle from './_components/create-minutes-title';
import EnhancedMinutesDisplay from './_components/enhanced-minutes-display';
import MeetingContentsForm from './_components/meeting-contents-form';
import ModifyMinutesForm from './_components/modify-minutes-form';

export default function Layout() {
  const [isEditing, setIsEditing] = useState(false);
  const [preEditEnhancedMinutes, setPreEditEnhancedMinutes] = useState('');
  const dispatch = useAppDispatch();
  const { result, feedbackAt } = useAppSelector(selectCreateMinutes);
  const [isCreatingMinutes, setIsCreatingMinutes] = useState(false);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  useEffect(() => {
    setPreEditEnhancedMinutes(result);
  }, [result]);

  const handleEditChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPreEditEnhancedMinutes(e.target.value);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setPreEditEnhancedMinutes(result);
  };

  const handleCancel = () => {
    setPreEditEnhancedMinutes(result);
    setIsEditing(false);
  };

  const handleSave = () => {
    dispatch(setResult({ result: preEditEnhancedMinutes, feedbackAt }));
    setIsEditing(false);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(result);
    toast.success(getMessage('I_F_00050', '作成結果'));
  };

  const handleFormatDownload = async () => {
    if (!result) {
      toast.error('ダウンロードする議事録がありません');
      return;
    }

    try {
      toast.info('Excelファイルを作成中...');
      const base64Data = await downloadMinutesFormat(result);

      // base64をBlobに変換
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // ダウンロード処理
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timestamp = `${year}${month}${day}_${hours}${minutes}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `議事録_${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Excelファイルをダウンロードしました');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Excelファイルのダウンロードに失敗しました');
    }
  };

  return (
    <PageLayout className="flex flex-col">
      <CreateMinutesTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {(isLeftOnly || isTwoColumns) && (
          <MeetingContentsForm
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
            setIsCreatingMinutes={setIsCreatingMinutes}
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
                    handleFormatDownload={handleFormatDownload}
                  />
                  <EnhancedMinutesDisplay
                    isEditing={isEditing}
                    onChange={handleEditChange}
                    result={preEditEnhancedMinutes}
                    handleCopy={copyMessage}
                    className="mb-3 mt-1"
                    isSubmitting={isCreatingMinutes}
                  />
                </div>
                <ModifyMinutesForm
                  className="h-[calc((100%-48px)/5)]"
                  switchLayout={switchLayout}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
