import { Loader2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/app/_components/ui/button';
import { cn } from '@/app/_utils/tw-merge';
import { NewProductIdeaSchema } from '../_utils/schema';
import { SelectTab } from './new-product-idea-input-form';

interface Props {
  selectedTab: SelectTab;
  className?: string;
}

export default function SubmitButton({ selectedTab, className }: Props) {
  const {
    watch,
    formState: { isSubmitting },
  } = useFormContext<NewProductIdeaSchema>();
  const { text, fileList, ideaDirection } = watch();

  // fileListの長さをチェック（FileList, FileReference[], undefined に対応）
  const hasFiles = fileList
    ? fileList instanceof FileList
      ? fileList.length > 0
      : Array.isArray(fileList) && fileList.length > 0
    : false;

  return (
    <Button
      type="submit"
      variant="secondary"
      disabled={
        selectedTab === 'file-upload'
          ? !hasFiles || !ideaDirection || isSubmitting
          : !text || !ideaDirection || isSubmitting
      }
      className={cn('mx-auto w-full max-w-[296px]', className)}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          <span>アイデアを作成中</span>
        </>
      ) : (
        <span>作成する</span>
      )}
    </Button>
  );
}
