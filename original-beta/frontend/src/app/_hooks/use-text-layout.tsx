import { useCallback, useEffect, useState } from 'react';
import {
  LAYOUT_LEFT_ONLY,
  LAYOUT_RIGHT_ONLY,
  LAYOUT_TWO_COLUMNS,
  LayoutType,
} from '../_constants/common-usecase';

export const useUseCaseLayout = (initial: string, resetKey?: unknown) => {
  const [layout, setLayout] = useState<LayoutType>(initial ? LAYOUT_RIGHT_ONLY : LAYOUT_LEFT_ONLY);

  useEffect(() => {
    setLayout(initial ? LAYOUT_RIGHT_ONLY : LAYOUT_LEFT_ONLY);
  }, [resetKey, initial]);

  const isTwoColumns = layout === LAYOUT_TWO_COLUMNS;
  const isLeftOnly = layout === LAYOUT_LEFT_ONLY;
  const isRightOnly = layout === LAYOUT_RIGHT_ONLY;

  const switchLayout = useCallback((newLayout: LayoutType) => {
    setLayout(newLayout);
  }, []);

  return {
    layout,
    isTwoColumns,
    isLeftOnly,
    isRightOnly,
    switchLayout,
  };
};
