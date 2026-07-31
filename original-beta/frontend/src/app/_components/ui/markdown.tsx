import { Copy } from 'lucide-react';
import { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import TextLink from '@/app/_components/ui/text-link';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';

type Props = {
  children: string;
  customComponents?: Partial<Components>;
  customClasses?: {
    [key: string]: string;
  };
  className?: string;
};

const customCodeBlockStyle = {
  background: '#F7F7F7',
  borderRadius: '6px',
  padding: '12px',
  fontSize: '13px',
  margin: 0,
};

function NonMemorizedMarkdown({
  children,
  customComponents = {},
  customClasses = {},
  className = '',
}: Props) {
  const components: Partial<Components> = {
    p: ({ children, ...props }) => {
      return (
        <p
          className={cn('whitespace-pre-wrap break-all text-lg', customClasses?.p || '')}
          {...props}
        >
          {children}
        </p>
      );
    },
    strong: ({ children, ...props }) => {
      return (
        <strong className={cn('font-bold', customClasses?.strong || '')} {...props}>
          {children}
        </strong>
      );
    },
    b: ({ children, ...props }) => {
      return (
        <span className={cn('font-bold', customClasses?.b || '')} {...props}>
          {children}
        </span>
      );
    },
    ol: ({ children, ...props }) => {
      return (
        <ol
          className={cn('custom-ordered-list my-2 ml-5 text-lg', customClasses?.ol || '')}
          {...props}
        >
          {children}
        </ol>
      );
    },
    ul: ({ children, ...props }) => {
      return (
        <ul
          className={cn('custom-list my-2 ml-5 list-outside text-lg', customClasses?.ul || '')}
          {...props}
        >
          {children}
        </ul>
      );
    },
    li: ({ children, ...props }) => {
      return (
        <li className={cn('mt-2 text-lg', customClasses?.li || '')} {...props}>
          {children}
        </li>
      );
    },
    a: ({ children, href, ...props }) => {
      return (
        <TextLink
          href={href!}
          target="_blank"
          className={cn('text-lg break-all', customClasses?.a || '')}
          {...props}
        >
          {children}
        </TextLink>
      );
    },
    h1: ({ children, ...props }) => {
      return (
        <h1 className={cn('mb-2 mt-6 text-6xl font-bold', customClasses?.h1 || '')} {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      return (
        <h2 className={cn('mb-2 mt-6 text-5xl font-bold', customClasses?.h2 || '')} {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      return (
        <h3 className={cn('mb-2 mt-6 text-3xl font-bold', customClasses?.h3 || '')} {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }) => {
      return (
        <h4 className={cn('mb-2 mt-6 text-2xl font-bold', customClasses?.h4 || '')} {...props}>
          {children}
        </h4>
      );
    },
    h5: ({ children, ...props }) => {
      return (
        <h5 className={cn('mb-2 mt-6 text-xl font-bold', customClasses?.h5 || '')} {...props}>
          {children}
        </h5>
      );
    },
    h6: ({ children, ...props }) => {
      return (
        <h6 className={cn('mb-2 mt-6 text-lg font-bold', customClasses?.h6 || '')} {...props}>
          {children}
        </h6>
      );
    },
    table: ({ children, ...props }) => {
      return (
        <div className="my-2 overflow-x-auto">
          <table className={cn('table-auto', customClasses?.table || '')} {...props}>
            {children}
          </table>
        </div>
      );
    },
    th: ({ children, ...props }) => {
      return (
        <th
          className={cn(
            'border border-neutral-100 bg-neutral-50 p-2 text-center',
            customClasses?.th || ''
          )}
          {...props}
        >
          {children}
        </th>
      );
    },
    td: ({ children, ...props }) => {
      return (
        <td
          className={cn('border border-neutral-100 bg-neutral-0 p-2', customClasses?.td || '')}
          {...props}
        >
          {children}
        </td>
      );
    },
    hr: ({ ...props }) => {
      return (
        <hr className={cn('my-2 border border-slate-300', customClasses?.hr || '')} {...props} />
      );
    },
    code: ({ children, className, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');

      const copyCode = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        navigator.clipboard.writeText(children as string);
        toast.success(getMessage('I_F_00050', 'コード'));
      };
      return match ? (
        <div className="my-2">
          <div className="flex justify-between bg-neutral-100 px-3 py-[6.5px]">
            <p>{match[1]}</p>
            <button onClick={copyCode} className="flex px-[6px] py-[2px] text-xs ">
              <Copy size={16} />
              <span className="ml-2">コピー</span>
            </button>
          </div>
          <SyntaxHighlighter language={match[1]} customStyle={customCodeBlockStyle}>
            {children as string}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className={`${className} my-2 whitespace-pre-wrap break-all rounded-sm border border-neutral-100 bg-neutral-50 px-1 py-0.5 text-sm dark:bg-zinc-800`}
          {...props}
        >
          {children}
        </code>
      );
    },
    blockquote: ({ children, ...props }) => {
      return (
        <blockquote
          className="my-2 border-l-4 border-neutral-200 bg-neutral-0 px-3 py-2 text-neutral-500"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    ...customComponents,
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={components}
      className={className}
    >
      {children}
    </ReactMarkdown>
  );
}

const Markdown = memo(
  NonMemorizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

export default Markdown;
