// 提案書選択エリア
import FileDropAreaWithTempStorage from '@/app/_components/file-drop-area-with-temp-storage';
import { FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { setTalkScript } from '@/app/_store/slice/talk-script';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../_utils/schema';

export default function ProposalSelectionArea() {
  return (
    <FormItem>
      <RequiredLabel>提案書</RequiredLabel>
      <FileDropAreaWithTempStorage
        name="files"
        setRedux={setTalkScript}
        accept={ALLOWED_FILE_TYPES}
        maxSize={MAX_FILE_SIZE}
        uploadPrefix="temp/talk_script"
      />
    </FormItem>
  );
}
