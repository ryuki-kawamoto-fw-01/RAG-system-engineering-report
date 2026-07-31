// 本文エリア
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem } from '@/app/_components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreatedContent } from '@/app/_store/slice/create-mail';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Label } from '../../../_components/ui/label';
import { Textarea } from '../../../_components/ui/textarea';
import { ModifyMailSchema } from '../_utils/schema';
import ActionButtons from './action-buttons';

type Props = {
  className?: string;
};

export function CreateContentArea({ className }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [preEditContent, setPreEditContent] = useState('');
  const {
    onChangeField,
    control,
    watch,
    formState: { isSubmitting },
  } = useFormReduxContext<ModifyMailSchema>({
    setRedux: setCreatedContent,
  });

  const createdContent = watch('createdContent', '');

  useEffect(() => {
    setPreEditContent(createdContent);
  }, [createdContent]);

  const handleEditContent = () => {
    setIsEditing(true);
  };

  const handleCancelContent = () => {
    setPreEditContent(createdContent);
    setIsEditing(false);
  };

  const handleSaveContent = () => {
    onChangeField(preEditContent);
    setIsEditing(false);
  };

  const copyContent = () => {
    navigator.clipboard.writeText(createdContent);
    toast.success(getMessage('I_F_00050', '作成結果'));
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label htmlFor="created-content" className="text-base">
          本文
        </Label>
        <ActionButtons
          isEditing={isEditing}
          handleEdit={handleEditContent}
          handleCancel={handleCancelContent}
          handleSave={handleSaveContent}
        />
      </div>
      <FormField
        control={control}
        name="createdContent"
        render={({ field }) => (
          <FormItem className="flex-1">
            <div className="relative h-full">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="icon"
                      size="icon"
                      onClick={copyContent}
                      className="absolute right-1 top-1 z-10"
                    >
                      <SvgCopy className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>コピー</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Textarea
                {...field}
                onChange={(e) => {
                  setPreEditContent(e.target.value);
                }}
                value={preEditContent}
                readOnly={!isEditing}
                placeholder={
                  isSubmitting ? '本文を作成中...' : 'ここに生成された本文が表示されます'
                }
                className="h-full"
              />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
