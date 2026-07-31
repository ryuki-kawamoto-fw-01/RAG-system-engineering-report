import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';

type AgentTitleProps = {
  title: string;
  message: string;
  className?: string;
};

export default function AgentTitle({ title, message, className }: AgentTitleProps): JSX.Element {
  return (
    <Heading level={3} className={`flex items-center gap-x-[2px] ${className}`}>
      {title}
      <Help message={message} />
    </Heading>
  );
}
