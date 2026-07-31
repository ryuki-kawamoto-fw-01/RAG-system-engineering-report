'use client';

import * as React from 'react';
import { useState } from 'react';
import { cn } from '../../_utils/tw-merge';
import SvgClose from '../icon/button/Close';

interface ImageModalProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
}

export default function ImageModal({ src, alt = 'Image', className, ...props }: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* サムネイル画像 */}
      <img
        src={src}
        alt={alt}
        className={cn('cursor-pointer transition-opacity hover:opacity-80', className)}
        onClick={() => setIsOpen(true)}
        {...props}
      />

      {/* モーダル */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setIsOpen(false)}
        >
          {/* 閉じるボタン（画面右上） */}
          <button
            className="fixed right-4 top-4 z-10 text-white transition-opacity hover:opacity-70"
            onClick={() => setIsOpen(false)}
            aria-label="閉じる"
          >
            <SvgClose className="size-6" />
          </button>

          <div className="relative max-h-[90vh] max-w-[90vw]">
            {/* 拡大画像 */}
            <img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
