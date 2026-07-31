'use client';

import { ThumbsUp } from 'lucide-react';
import { Send } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { goodFeedbackOptions, goodFeedbacktext } from '../../../../../../config';
import { Button } from '../../../../_components/ui/button';
import { Checkbox } from '../../../../_components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../_components/ui/dialog';
import { Label } from '../../../../_components/ui/label';
import { Textarea } from '../../../../_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../_components/ui/tooltip';
import { cn } from '../../../../_utils/tw-merge';
import feedbackChatMessage from '../_actions/feedbackChatMessage';

interface FeedbackButtonProps {
  messageId: string;
  isSubmitted: boolean;
  onSubmit: () => void;
}

export default function FeedbackGoodButton({
  messageId,
  isSubmitted,
  onSubmit,
}: FeedbackButtonProps): JSX.Element {
  //const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [feedbackOptions, setFeedbackOptions] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleOpenChange = useCallback(
    (open: boolean): void => {
      if (!isSubmitted) {
        setIsOpen(open);
      }
    },
    [isSubmitted]
  );

  const handleOptionChange = useCallback((optionId: string, checked: boolean): void => {
    setFeedbackOptions((prev) =>
      checked ? [...prev, optionId] : prev.filter((id) => id !== optionId)
    );
    setError('');
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (feedbackOptions.length === 0) {
      setError('少なくとも1つのオプションを選択してください。');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await feedbackChatMessage(messageId, 1, feedbackOptions, feedbackText);
    if (res.success) {
      onSubmit();
      toast.success('フィードバックを送信しました。ありがとうございました！');
      setIsOpen(false);
    } else {
      toast.error('フィードバックの送信に失敗しました。もう一度お試しください。');
    }

    setIsSubmitting(false);
  }, [feedbackOptions, feedbackText, messageId, onSubmit]);

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('p-0 w-6 h-6', isSubmitted ? 'text-gray-500' : '')}
              onClick={() => handleOpenChange(true)}
              disabled={isSubmitted}
            >
              <ThumbsUp size={14} className={cn(isSubmitted ? 'text-gray-500 fill-current' : '')} />
              <span className="sr-only">良い回答</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="dark:bg-dark-gray bg-gray-100 text-black dark:text-white">
            <p>この回答は役立ちました</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="dark:bg-dark-gray bg-gray-100 text-black dark:text-white sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>フィードバックを頂きありがとうございました！</DialogTitle>
            <DialogDescription>
              より良いサービスをご提供するにあたり、追加のフィードバックをお願いいたします。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-base">
                評価の理由として当てはまるものを1つ以上選択してください。【必須】
              </Label>
              <div className="mt-2">
                {goodFeedbackOptions.map((option) => (
                  <div key={option.id} className="mb-2 flex items-center">
                    <Checkbox
                      id={option.id}
                      checked={feedbackOptions.includes(option.id)}
                      onCheckedChange={(checked) =>
                        handleOptionChange(option.id, checked as boolean)
                      }
                    />
                    <span>&emsp;{option.label}</span>
                  </div>
                ))}
              </div>
              {error && <p className="mt-2 text-base text-red-500">{error}</p>}
            </div>
            <div>
              <Textarea
                placeholder={goodFeedbacktext}
                value={feedbackText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFeedbackText(e.target.value)
                }
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="border border-black text-black shadow-md hover:bg-gray-200 dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-gray-800"
            >
              <Send className="mr-2" size={14} />
              {isSubmitting ? '送信中...' : '送信'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
