'use client';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';
import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import { useAppDispatch, useAppSelector } from '../../_store/hooks';
import { selectTranscriptionHandwritten } from '../../_store/selectors/transcription-handwritten';
import { setResult } from '../../_store/slice/transcription-handwritten';
import ActionButtons from './_components/action-buttons';
import EnhancedTranscriptionHandwrittenDisplay from './_components/enhanced-transcription-handwritten-display';
import TranscriptionHandwrittenContentsForm from './_components/transcription-handwritten-contents-form';
import TranscriptionHandwrittenTitle from './_components/transcription-handwritten-title';

export default function Layout() {
  const [isEditing, setIsEditing] = useState(false);
  const [preEditEnhancedTranscriptionHandwritten, setPreEditEnhancedTranscriptionHandwritten] =
    useState('');
  const dispatch = useAppDispatch();
  const { result, feedbackAt } = useAppSelector(selectTranscriptionHandwritten);
  const [isTranscriptionHandwritten, setIsTranscriptionHandwritten] = useState(false);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  useEffect(() => {
    setPreEditEnhancedTranscriptionHandwritten(result);
  }, [result]);

  const handleEditChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPreEditEnhancedTranscriptionHandwritten(e.target.value);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setPreEditEnhancedTranscriptionHandwritten(result);
  };

  const handleCancel = () => {
    setPreEditEnhancedTranscriptionHandwritten(result);
    setIsEditing(false);
  };

  const handleSave = () => {
    dispatch(setResult({ result: preEditEnhancedTranscriptionHandwritten, feedbackAt }));
    setIsEditing(false);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(result);
    toast.success(getMessage('I_F_00050', '作成結果'));
  };

  return (
    <PageLayout className="flex flex-col">
      <TranscriptionHandwrittenTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {(isLeftOnly || isTwoColumns) && (
          <TranscriptionHandwrittenContentsForm
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
            setIsTranscriptionHandwritten={setIsTranscriptionHandwritten}
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
                  />
                  <EnhancedTranscriptionHandwrittenDisplay
                    isEditing={isEditing}
                    onChange={handleEditChange}
                    result={preEditEnhancedTranscriptionHandwritten}
                    handleCopy={copyMessage}
                    className="mb-3 mt-1"
                    isSubmitting={isTranscriptionHandwritten}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
