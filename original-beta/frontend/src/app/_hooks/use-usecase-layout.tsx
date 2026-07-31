import { useCallback, useState } from 'react';
import {
  LAYOUT_LEFT_ONLY,
  LAYOUT_RIGHT_ONLY,
  LAYOUT_TWO_COLUMNS,
  LayoutType,
} from '../_constants/common-usecase';

export const useUseCaseLayout = (result: string) => {
  const [layout, setLayout] = useState<LayoutType>(result ? LAYOUT_RIGHT_ONLY : LAYOUT_LEFT_ONLY);

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
