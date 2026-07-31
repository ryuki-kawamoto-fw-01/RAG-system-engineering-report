import { title, version } from '../../../../config';
// import { ModeToggle } from '../../_components/ui/mode-toggle';

export default function Page() {
  return (
    <div className="relative flex grow flex-col items-center justify-center px-6 py-4">
      <h1 className="text-6xl font-bold tracking-tight">{title}</h1>
      {/* <div className="mt-4">
        <ModeToggle />
      </div> */}
      <div className="fixed bottom-0 right-0 p-2 text-xs">バージョン {version}</div>
    </div>
  );
}
