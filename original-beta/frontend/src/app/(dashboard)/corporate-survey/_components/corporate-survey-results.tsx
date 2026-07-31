// 企業調査結果
import { cn } from '@/app/_utils/tw-merge';
import CorporateInformationArea from './corporate-information-area';

// Web検索対応時にコメントアウトを外す
// interface CorporateSurveyResultsProps {
//   isReferencesPanelOpen?: boolean;
//   setIsReferencesPanelOpen?: (isOpen: boolean) => void;
// }

type Props = {
  className?: string;
};

export default function CorporateSurveyResults({ className }: Props) {
  // Web検索対応時にコメントアウトを外す
  //   {
  //   isReferencesPanelOpen,
  //   setIsReferencesPanelOpen,
  // }: CorporateSurveyResultsProps
  return (
    // 企業調査結果エリア
    <div className={cn('h-full', className)}>
      <CorporateInformationArea
      // Web検索対応時にコメントアウトを外す
      // isReferencesPanelOpen={isReferencesPanelOpen}
      // setIsReferencesPanelOpen={setIsReferencesPanelOpen}
      />
    </div>
  );
}
