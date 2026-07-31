// 件名エリア
import { useEffect, useState } from 'react';
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
import { setCreatedSubject } from '@/app/_store/slice/create-mail';
import { getMessage } from '@/app/_utils/message';
import { Input } from '../../../_components/ui/input';
import { Label } from '../../../_components/ui/label';
import { ModifyMailSchema } from '../_utils/schema';
import ActionButtons from './action-buttons';

export function CreateSubjectArea() {
  const [isEditing, setIsEditing] = useState(false);
  const [preEditSubject, setPreEditSubject] = useState('');

  const {
    onChangeField,
    control,
    watch,
    formState: { isSubmitting },
  } = useFormReduxContext<ModifyMailSchema>({
    setRedux: setCreatedSubject,
  });
  const createdSubject = watch('createdSubject', '');

  useEffect(() => {
    setPreEditSubject(createdSubject);
  }, [createdSubject]);

  const handleEditSubject = () => {
    setIsEditing(true);
  };

  const handleCancelSubject = () => {
    setPreEditSubject(createdSubject);
    setIsEditing(false);
  };

  const handleSaveSubject = () => {
    onChangeField(preEditSubject);
    setIsEditing(false);
  };

  const copySubject = () => {
    navigator.clipboard.writeText(createdSubject);
    toast.success(getMessage('I_F_00050', '作成結果'));
  };

  return (
    <div>
      <div className="flex min-h-8 items-end justify-between">
        <Label htmlFor="created-subject" className="text-base">
          件名
        </Label>
        <ActionButtons
          isEditing={isEditing}
          handleEdit={handleEditSubject}
          handleCancel={handleCancelSubject}
          handleSave={handleSaveSubject}
        />
      </div>
      <FormField
        control={control}
        name="createdSubject"
        render={({ field }) => (
          <FormItem className="relative mt-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="icon"
                    size="icon"
                    onClick={copySubject}
                    className="absolute right-0.5 top-0.5 z-10"
                  >
                    <SvgCopy className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>コピー</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Input
              {...field}
              onChange={(e) => {
                setPreEditSubject(e.target.value);
              }}
              value={preEditSubject}
              readOnly={!isEditing}
              id="created-subject"
              placeholder={isSubmitting ? '件名を作成中...' : 'ここに生成された件名が表示されます'}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
