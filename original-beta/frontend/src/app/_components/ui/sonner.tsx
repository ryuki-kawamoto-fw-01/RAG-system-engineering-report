'use client';

import { useTheme } from 'next-themes';
import { GoCheckCircleFill, GoAlertFill, GoX } from 'react-icons/go';
import { Toaster as Sonner } from 'sonner';
import { Spinner } from './spinner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-right"
      className="toaster group absolute top-[70px] mb-0 max-w-xs"
      closeButton={true}
      icons={{
        success: <GoCheckCircleFill className="colo size-[20px] text-green-500" />,
        error: <GoAlertFill className="size-[20px] text-red-600" />,
        close: <GoX className="size-[16px] bg-inherit" />,
        loading: <Spinner size="small" />,
      }}
      toastOptions={{
        duration: 8000,
        classNames: {
          title: 'font-normal',
          toast:
            'right-[40px] shadow-focus gap-[10px] w-fit group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-focus whitespace-pre-line text-xs p-[12px] pr-[28px] gap-y-10rounded-lg min-w-auto flex items-center',
          loading:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg whitespace-pre-line',
          error:
            'group-[.toaster]:bg-red-50 group-[.toaster]:text-red-600 border-red-600 border [&_a]:text-sky-700 [&_a:hover]:underline',
          closeButton: 'top-[44%] left-auto right-0 !bg-inherit hover:!bg-inherit border-0',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
