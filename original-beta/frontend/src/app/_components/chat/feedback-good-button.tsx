'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import feedbackAgentChatMessage from '@/app/(dashboard)/agent/[task]/[id]/_actions/feedbackChatMessage';
import feedbackRagChatMessage from '@/app/(dashboard)/rag-chat/[id]/_actions/feedbackChatMessage';
// import feedbackVoiceChatMessage from '@/app/(dashboard)/voice-input/[id]/_actions/feedbackVoiceChatMessage';
import SvgDisabledGood from '@/app/_components/icon/button/DisabledGood';
import SvgGood from '@/app/_components/icon/button/Good';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { getMessage } from '@/app/_utils/message';
import feedbackChatMessage from '../../(dashboard)/chat/[id]/_actions/feedbackChatMessage';
import { goodFeedbackOptions } from '../../../../config';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import OptionalLabel from '../ui/optional-label';
import RequiredLabel from '../ui/required-label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const MAX_TEXT_LENGTH = 255;
const FeedbackSchema = z.object({
  reasons: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: '少なくとも1つのオプションを選択してください',
  }),
  text: z
    .string()
    .max(MAX_TEXT_LENGTH, { message: `${MAX_TEXT_LENGTH}文字以内で入力してください` }),
});

interface FeedbackButtonProps {
  source?: 'chat' | 'rag' | 'voice' | 'agent';
  messageId: string;
  isSubmitted: boolean;
}

export default function FeedbackGoodButton({
  source = 'chat',
  messageId,
  isSubmitted,
}: FeedbackButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof FeedbackSchema>>({
    resolver: zodResolver(FeedbackSchema),
    defaultValues: {
      reasons: [],
      text: '',
    },
  });
  const { isLoading } = form.formState;

  const onSubmit = async (data: z.infer<typeof FeedbackSchema>) => {
    let res = { success: false };
    if (source === 'rag') {
      res = await feedbackRagChatMessage(messageId, 1, data.reasons, data.text);
    } else if (source === 'chat') {
      res = await feedbackChatMessage(messageId, 1, data.reasons, data.text);
    } else if (source === 'agent') {
      res = await feedbackAgentChatMessage(messageId, 1, data.reasons, data.text);
      // } else if (source === 'voice') {
      //   res = await feedbackVoiceChatMessage(messageId, 1, data.reasons, data.text);
    }

    if (res.success) {
      toast.success(getMessage('I_F_00070'));
      setIsOpen(false);
    } else {
      toast.error(getMessage('E_F_00190'));
    }
  };

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="icon"
              size="icon-sm"
              disabled={isSubmitted}
              onClick={() => setIsOpen(true)}
            >
              {isSubmitted ? (
                <SvgDisabledGood className="size-4" />
              ) : (
                <SvgGood className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>この回答は役立ちました</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フィードバックを頂きありがとうございました！</DialogTitle>
          </DialogHeader>
          <div>
            <p>回答の評価をいただきありがとうございます！</p>
            <p>サービス向上のため、具体的なご意見をお聞かせください。</p>
            <Form {...form}>
              <form className="mt-6">
                <FormField
                  control={form.control}
                  name="reasons"
                  render={() => (
                    <FormItem>
                      <div className="mb-2.5">
                        <RequiredLabel>
                          評価の理由として当てはまるものを1つ以上選択してください。
                        </RequiredLabel>
                      </div>
                      {goodFeedbackOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="reasons"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex items-center space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value!, item.id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== item.id)
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-lg">{item.label}</FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <OptionalLabel>
                        特に気に入った点・もっとこうしてほしい点があれば教えてください。
                      </OptionalLabel>
                      <FormControl>
                        <Input placeholder="例：より詳細な情報を提供してほしい。" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          <DialogFooter>
            <Button variant="tertiary" className="w-[120px]" onClick={() => setIsOpen(false)}>
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={isLoading}
              onClick={() => form.handleSubmit(onSubmit)()}
              className="w-[120px]"
            >
              送信する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
