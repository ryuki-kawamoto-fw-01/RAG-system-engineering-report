import { DialogDescription } from '@radix-ui/react-dialog';
import React from 'react';
import { Button } from '../../../_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../_components/ui/dialog';

type DialogButtonProps = {
  open: boolean;
  handleOpen: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  buttonText: string;
  buttonIcon: React.ReactNode;
  children: React.ReactNode;
  iconOnly?: boolean;
};

export default function DialogButton({
  open,
  handleOpen,
  title,
  description,
  buttonText,
  buttonIcon,
  children,
  iconOnly = false,
}: DialogButtonProps) {
  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <div className="cursor-pointer">{buttonIcon}</div>
        ) : (
          <Button variant="outline" size="sm">
            {buttonIcon}
            <span className="ml-2">{buttonText}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-gray-700 dark:text-gray-300">
            {title}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="mb-4 text-gray-500 dark:text-gray-400">
          {description}
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
