'use server';

// 正しいパスに修正
import { createIncidentReportDB } from '@/app/_db/incident_report';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { incidentReportContainer } from '../../../../../cosmos';
import { IncidentReportSchema } from '../_utills/schema';

// レスポンスの型定義
type ApiResponse = {
  success: boolean;
  content?: string;
  message?: string;
  id?: string; // Added to return document ID
};

// 労働災害報告書生成API
export async function generateIncidentReport(data: IncidentReportSchema): Promise<ApiResponse> {
  try {
    // 必須項目のバリデーション
    if (
      !data.incidentDateTime.trim() ||
      !data.incidentLocation.trim() ||
      !data.reporter.trim() ||
      !data.yearsOfService.trim() ||
      !data.workExperience.trim() ||
      !data.jobDescription.trim() ||
      !data.disasterType.trim() ||
      !data.manualAvailability ||
      !data.complianceStatus ||
      !data.manualLastUpdated ||
      !data.equipmentName.trim() ||
      !data.installationYear.trim() ||
      !data.lastInspectionDate.trim() ||
      !data.maintenanceHistory.trim() ||
      !data.equipmentMalfunctionHistory.trim()
    ) {
      return {
        success: false,
        message: '全ての必須項目を入力してください',
      };
    }

    // ユーザー情報取得
    const user = await getCurrentUser();

    // API呼び出し
    const response = await useCaseAzureFunctions.sendJson<IncidentReportSchema, ApiResponse>(
      'incident-report',
      'POST',
      data
    );

    if (response && response.success) {
      // CosmosDBへ保存
      try {
        const created = await createIncidentReportDB(incidentReportContainer, {
          id: crypto.randomUUID(),
          userId: user.id,
          useName: user.name,
          userEmail: user.email,
          userDepartmentName: user.departmentName,
          createdAt: new Date(),
          incidentDateTime: data.incidentDateTime,
          incidentLocation: data.incidentLocation,
          reporter: data.reporter,
          yearsOfService: data.yearsOfService,
          workExperience: data.workExperience,
          jobDescription: data.jobDescription,
          disasterType: data.disasterType,
          manualAvailability: data.manualAvailability,
          complianceStatus: data.complianceStatus,
          manualLastUpdated: data.manualLastUpdated,
          equipmentName: data.equipmentName,
          installationYear: data.installationYear,
          lastInspectionDate: data.lastInspectionDate,
          maintenanceHistory: data.maintenanceHistory,
          equipmentMalfunctionHistory: data.equipmentMalfunctionHistory,
          type: data.disasterType,
          additionalConsiderations: '',
          keyPointExtractionResult: response.content ?? '',
        });
        // 生成したドキュメントのIDを戻り値に含める
        return {
          success: true,
          content: response.content,
          id: created?.id,
        };
      } catch (dbError) {
        console.error('CosmosDB保存エラー:', dbError);
        // DBエラーはAPI成功時は無視して進める
      }
      return {
        success: true,
        content: response.content,
      };
    }
    return {
      success: false,
      message: response?.message || getMessage('E_F_00190', '労働災害報告書'),
    };
  } catch (error) {
    let errorMessage = 'サーバー処理中にエラーが発生しました';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      success: false,
      message: errorMessage,
    };
  }
}
