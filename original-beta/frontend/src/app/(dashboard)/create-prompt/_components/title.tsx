import { Button } from '@/app/_components/ui/button';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
interface CreatePromptTitleProps {
  handleReset: () => void;
}

export default function CreatePromptTitle({ handleReset }: CreatePromptTitleProps): JSX.Element {
  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-0.5">
        プロンプト概要
      </Heading>
      <Help
        message={`効果が出やすいプロンプトを作成する画面です。\nユーザで共用できるように、プロンプト登録することを推奨します。\n※プロンプト：入力欄に打ち込む生成AIへの指示文。`}
        className="mr-1.5"
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="link" size="link" onClick={handleReset} className="text-sx">
              情報をクリア
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>入出力内容を削除して新しく始める</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
