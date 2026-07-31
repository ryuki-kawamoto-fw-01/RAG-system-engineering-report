'use client';

import { toast } from 'sonner';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { LAYOUT_RIGHT_ONLY } from '@/app/_constants/common-usecase';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setLoading, setResult, setId } from '@/app/_store/slice/flow-designer';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createFlowDesigner } from './_actions/flow-designer';
import FlowDesignerFormArea from './_components/flow-designer-form-area';
import FlowDesignerResult from './_components/flow-designer-result';
import FlowDesignerTitle from './_components/flow-designer-title';
import type { FlowDesignerSchema } from './_utils/schema';

export default function FlowDesignerPage() {
  const dispatch = useAppDispatch();
  const { result } = useAppSelector((state) => state.flowDesigner);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  const handleSubmit = async (data: FlowDesignerSchema) => {
    try {
      dispatch(setLoading(true));
      const id = uniqueId();
      const response = await createFlowDesigner(id, data);

      if ('error' in response) {
        toast.error(getMessage('E_F_00110', '工程管理表'));
        return;
      }

      dispatch(setResult({ result: response.result, feedbackAt: undefined }));
      dispatch(setId(id));
      toast.success(getMessage('I_F_00030', '工程管理表'));
      switchLayout(LAYOUT_RIGHT_ONLY);
    } catch (error) {
      console.error('Failed to create flow designer:', error);
      toast.error(getMessage('E_F_00110', '工程管理表'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <PageLayout className="flex flex-col">
      <FlowDesignerTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex flex-1 gap-x-10 overflow-hidden">
        {/* フォームエリア */}
        {(isLeftOnly || isTwoColumns) && (
          <FlowDesignerFormArea
            onSubmit={handleSubmit}
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
          />
        )}
        {/* 結果表示エリア */}
        {(isRightOnly || isTwoColumns) && (
          <FlowDesignerResult className={cn('w-full', isTwoColumns && 'w-2/3')} />
        )}
      </div>
    </PageLayout>
  );
}
