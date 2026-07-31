import FileDropAreaWithTempStorage from '@/app/_components/file-drop-area-with-temp-storage';
import { FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { setDesignDocumentReview } from '@/app/_store/slice/design-document-review';
import { ALLOWED_FILE_TYPES } from '../_utils/schema';

export default function DesignDocumentUploadForm() {
  return (
    <FormItem>
      <RequiredLabel>設計書</RequiredLabel>
      <FileDropAreaWithTempStorage
        name="fileList"
        setRedux={setDesignDocumentReview}
        accept={ALLOWED_FILE_TYPES}
        uploadPrefix="temp/design_document_review"
      />
    </FormItem>
  );
}
