import SvgInfo from '../icon/button/Info';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

type Props = {
  message: string;
  size?: 'default' | 'sm';
  className?: string;
};

export default function Help({ message, size = 'default', className = '' }: Props) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="icon"
            size={size === 'default' ? 'icon' : 'icon-sm'}
            className={className}
          >
            <SvgInfo className={size === 'default' ? 'size-5' : 'size-4'} />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-96">{message}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
