import * as z from 'zod';

// 労働災害報告書用のスキーマ
export const incidentReportSchema = z.object({
  incidentDateTime: z.string().min(1, { message: '発生日時を入力してください' }),
  incidentLocation: z.string().min(1, { message: '災害発生場所を入力してください' }),
  reporter: z.string().min(1, { message: '報告者を入力してください' }),
  yearsOfService: z.string().min(1, { message: '勤続年数を入力してください' }),
  workExperience: z.string().min(1, { message: '業務経験を入力してください' }),
  jobDescription: z.string().min(1, { message: '業務内容を入力してください' }),
  disasterType: z.string().min(1, { message: '災害の種類を入力してください' }),
  manualAvailability: z
    .enum(['あり', 'なし'], {
      required_error: 'マニュアルの有無を選択してください',
      invalid_type_error: 'マニュアルの有無を選択してください',
    })
    .optional(),
  complianceStatus: z
    .enum(['完全遵守', '一部遵守', '未遵守'], {
      required_error: '遵守状況を選択してください',
      invalid_type_error: '遵守状況を選択してください',
    })
    .optional(),
  manualLastUpdated: z.date({
    required_error: 'マニュアルの最終更新日を選択してください',
    invalid_type_error: '有効な日付を選択してください',
  }),
  equipmentName: z.string().min(1, { message: '使用機械/設備名を入力してください' }),
  installationYear: z.string().min(1, { message: '導入年を入力してください' }),
  lastInspectionDate: z.string().min(1, { message: '最終点検日を入力してください' }),
  maintenanceHistory: z.string().min(1, { message: 'メンテナンス履歴を入力してください' }),
  equipmentMalfunctionHistory: z.string().min(1, { message: '機械の不具合歴を入力してください' }),
});

export type IncidentReportSchema = z.infer<typeof incidentReportSchema>;
