import {
  LAYOUT_LEFT_ONLY,
  LAYOUT_RIGHT_ONLY,
  LAYOUT_TWO_COLUMNS,
  LayoutType,
} from '@/app/_constants/common-usecase';
import SvgChevronLeft from '../icon/button/ChevronLeft';
import SvgChevronRight from '../icon/button/ChevronRight';
import TextLink from '../ui/text-link';

type Props = {
  currentLayout: LayoutType;
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function LayoutSwitchButton({ currentLayout, switchLayout, className }: Props) {
  if (currentLayout === LAYOUT_LEFT_ONLY) {
    return <></>;
  }

  if (currentLayout === LAYOUT_RIGHT_ONLY) {
    return (
      <div className={className}>
        <TextLink href="" onClick={() => switchLayout(LAYOUT_TWO_COLUMNS)}>
          プロンプトを表示
          <SvgChevronRight className="size-4" />
        </TextLink>
      </div>
    );
  }

  return (
    <div className={className}>
      <TextLink href="" onClick={() => switchLayout(LAYOUT_RIGHT_ONLY)}>
        <SvgChevronLeft className="size-4" />
        プロンプトを隠す
      </TextLink>
    </div>
  );
}
