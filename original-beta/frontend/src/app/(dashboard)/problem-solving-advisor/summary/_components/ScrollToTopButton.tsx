import { ReactNode } from 'react';

type ScrollToTopButtonProps = {
  onClick: () => void;
  children?: ReactNode;
};

export default function ScrollToTopButton({ onClick, children }: ScrollToTopButtonProps) {
  return (
    <div
      className="fixed bottom-5 right-10 z-[9999]"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '40px',
      }}
    >
      <button
        onClick={onClick}
        className="rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700 focus:outline-none"
        aria-label="トップに戻る"
      >
        {children || '↑'}
      </button>
    </div>
  );
}
