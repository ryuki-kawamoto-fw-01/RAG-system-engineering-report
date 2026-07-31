import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/app/_components/ui/button';
import Markdown from '@/app/_components/ui/markdown';
import { AgentStep, RefAnsItem, Status } from '../../_actions/schema';
import { CitationLink } from '../type';

type AgentStepListProps = {
  steps: AgentStep[];
  handleTitleClick: (title: string, filepath: string) => void;
  agentWaiting: boolean;
  onContinue: () => void;
  onStop: () => void;
};

export function AgentStepList({
  steps,
  handleTitleClick,
  agentWaiting,
  onContinue,
  onStop,
}: AgentStepListProps) {
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [steps, agentWaiting]);

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex shrink-0 items-center justify-between gap-3 self-stretch border-b border-neutral-100 bg-white px-5 py-3">
        <div className="w-full text-base font-bold text-neutral-900">
          <div className="max-w-[400px] truncate">タスクフロー</div>
        </div>
      </div>
      {/* ステップ一覧 */}
      <div className="h-full space-y-4 overflow-y-auto p-4">
        {steps.map((step, index) => (
          <AgentStepItem
            key={index}
            step={step}
            index={index}
            segments={step.segments}
            isSpecification={true}
            handleTitleClick={handleTitleClick}
          />
        ))}
        {/* 処理を続行するかどうかの確認 */}
        {agentWaiting && (
          <div className="flex flex-col items-center gap-4 rounded-xl bg-slate-50 p-5">
            <div className="text-center text-sm font-bold text-neutral-900">
              そのまま続けますか？
            </div>
            <div className="flex w-full gap-3">
              <Button variant="tertiary" className="h-10 flex-1" onClick={onStop}>
                タスクを停止する
              </Button>
              <Button className="h-10 flex-1" onClick={onContinue}>
                そのまま続ける
              </Button>
            </div>
          </div>
        )}
        <div ref={scrollBottomRef} />
      </div>
    </div>
  );
}

type AgentStepItemProps = {
  step: AgentStep;
  index: number;
  segments?: RefAnsItem[];
  isSpecification: boolean;
  handleTitleClick: (title: string, filepath: string) => void;
};

function AgentStepItem({
  step,
  index,
  segments,
  isSpecification,
  handleTitleClick,
}: AgentStepItemProps) {
  {
    /**tts,jksなど時間の都合でフロントでロジックを持っているがバックエンドで実装するようにしたい */
  }
  const ttsCitationLinks = (segments ?? [])
    .flatMap((segment) =>
      segment.citation
        ? segment.citation
            .filter((citation) => citation.search_path.includes('/TTS/'))
            .map((citation) => ({
              search_title: citation.search_title,
              search_path: citation.search_path,
            }))
        : []
    )
    .filter(
      (link, index, self) => index === self.findIndex((l) => l.search_path === link.search_path)
    );

  const jksCitationLinks = (segments ?? [])
    .flatMap((segment) =>
      segment.citation
        ? segment.citation
            .filter((citation) => citation.search_path.includes('/JKS/'))
            .map((citation) => ({
              search_title: citation.search_title,
              search_path: citation.search_path,
            }))
        : []
    )
    .filter(
      (link, index, self) => index === self.findIndex((l) => l.search_path === link.search_path)
    );

  const otherCitationLinks = (segments ?? [])
    .flatMap((segment) =>
      segment.citation
        ? segment.citation
            .filter(
              (citation) =>
                !citation.search_path.includes('/TTS/') && !citation.search_path.includes('/JKS/')
            )
            .map((citation) => ({
              search_title: citation.search_title,
              search_path: citation.search_path,
            }))
        : []
    )
    .filter(
      (link, index, self) => index === self.findIndex((l) => l.search_path === link.search_path)
    );

  const citationLinks = (segments ?? []).flatMap((segment) =>
    segment.citation
      ? segment.citation.map((citation) => ({
          search_title: citation.search_title,
          search_path: citation.search_path,
        }))
      : []
  );

  return (
    <div className="flex items-start space-x-2">
      <div>
        <div className="flex">
          <div className="flex size-5 items-center justify-center rounded-full border border-blue-500 bg-blue-500 text-white">
            {step.status === Status.Complete ? (
              <Check className="size-4 text-white" />
            ) : (
              <span className="text-2xs font-bold">{index + 1}</span>
            )}
          </div>
          <div className="ml-2 text-base">{step.title}</div>
        </div>
        {step.desc !== '' && (
          <Markdown customClasses={{ p: 'text-sm px-6 py-2', li: 'text-sm ml-2' }}>
            {step.desc}
          </Markdown>
        )}
        {segments && segments.length > 0 && (
          <div className="ml-8 mt-2">
            {isSpecification ? (
              <>
                <h5 className="text-sm">対象のファイル:</h5>
                <CitationLinks
                  title="TTS"
                  links={ttsCitationLinks}
                  handleTitleClick={handleTitleClick}
                />
                <CitationLinks
                  title="JKS"
                  links={jksCitationLinks}
                  handleTitleClick={handleTitleClick}
                />
                <CitationLinks
                  title="その他"
                  links={otherCitationLinks}
                  handleTitleClick={handleTitleClick}
                />
              </>
            ) : (
              <CitationLinks
                title="参照ファイル"
                links={citationLinks}
                handleTitleClick={handleTitleClick}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export type CitationLinksProps = {
  title: string;
  links: CitationLink[];
  handleTitleClick: (title: string, filepath: string) => void;
};

function CitationLinks({ title, links, handleTitleClick }: CitationLinksProps) {
  const [expanded, setExpanded] = useState(false);

  if (links.length === 0) return null;

  return (
    <>
      <h5 className="text-sm">{title}:</h5>
      {links.slice(0, expanded ? links.length : 2).map((citation, idx) => (
        <div key={idx}>
          <a
            href="#"
            className="ml-4 text-sm text-primary hover:underline"
            onClick={(e) => {
              e.preventDefault();
              handleTitleClick(title, citation.search_path);
            }}
          >
            {citation.search_title.slice(0, 50)}...
          </a>
        </div>
      ))}
      {links.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-4 text-sm text-primary hover:underline"
        >
          {expanded ? '閉じる' : `他${links.length - 2}件`}
        </button>
      )}
    </>
  );
}
