import { useFormContext } from 'react-hook-form';
import { Input } from '@/app/_components/ui/input';
import RequiredLabel from '@/app/_components/ui/required-label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { Textarea } from '@/app/_components/ui/textarea';
import { IncidentReportSchema } from '../_utills/schema';

export default function IncidentReportFormFields() {
  const { register, setValue, watch } = useFormContext<IncidentReportSchema>();
  const disasterType = watch('disasterType');

  return (
    <div className="space-y-8">
      {/* 基本情報セクション */}
      <div>
        <h3 className="mb-3 text-xl font-medium text-gray-600">基本情報</h3>
        <div className="space-y-3">
          <div>
            <RequiredLabel>発生日時</RequiredLabel>
            <Input
              type="datetime-local"
              {...register('incidentDateTime')}
              className="calendar-icon w-auto max-w-xs cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
          <div>
            <RequiredLabel>災害発生場所</RequiredLabel>
            <Input
              {...register('incidentLocation')}
              placeholder="例：工場内機械設備付近"
              className="w-full"
            />
          </div>
          <div>
            <RequiredLabel>報告者</RequiredLabel>
            <Input {...register('reporter')} placeholder="例：田中太郎" className="w-full" />
          </div>
        </div>
      </div>

      {/* 被災者情報セクション */}
      <div>
        <h3 className="mb-3 text-xl font-medium text-gray-600">被災者情報</h3>
        <div className="space-y-3">
          <div>
            <RequiredLabel>勤続年数</RequiredLabel>
            <Input {...register('yearsOfService')} placeholder="例：5年" className="w-full" />
          </div>
          <div>
            <RequiredLabel>業務経験</RequiredLabel>
            <Input
              {...register('workExperience')}
              placeholder="例：機械操作経験3年"
              className="w-full"
            />
          </div>
          <div>
            <RequiredLabel>業務内容</RequiredLabel>
            <Input
              {...register('jobDescription')}
              placeholder="例：プレス機操作"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 災害情報セクション */}
      <div>
        <h3 className="mb-3 text-xl font-medium text-gray-600">災害情報</h3>
        <div className="space-y-3">
          <div>
            <RequiredLabel>災害の種類</RequiredLabel>
            <Select onValueChange={(value) => setValue('disasterType', value)} value={disasterType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="災害の種類を選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="墜落・転落">墜落・転落</SelectItem>
                <SelectItem value="転倒">転倒</SelectItem>
                <SelectItem value="激突">激突</SelectItem>
                <SelectItem value="飛来・落下">飛来・落下</SelectItem>
                <SelectItem value="崩壊・倒壊">崩壊・倒壊</SelectItem>
                <SelectItem value="挟まれ・巻き込まれ">挟まれ・巻き込まれ</SelectItem>
                <SelectItem value="切れ・こすれ">切れ・こすれ</SelectItem>
                <SelectItem value="踏み抜き">踏み抜き</SelectItem>
                <SelectItem value="おぼれ">おぼれ</SelectItem>
                <SelectItem value="高温・低温の物との接触">高温・低温の物との接触</SelectItem>
                <SelectItem value="有害物等との接触">有害物等との接触</SelectItem>
                <SelectItem value="感電">感電</SelectItem>
                <SelectItem value="爆発">爆発</SelectItem>
                <SelectItem value="火災">火災</SelectItem>
                <SelectItem value="交通事故（道路）">交通事故（道路）</SelectItem>
                <SelectItem value="交通事故（その他）">交通事故（その他）</SelectItem>
                <SelectItem value="動作の反動・無理な動作">動作の反動・無理な動作</SelectItem>
                <SelectItem value="その他">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 作業環境評価セクション */}
      <div>
        <h3 className="mb-3 text-xl font-medium text-gray-600">作業環境評価</h3>
        <div className="space-y-3">
          <div>
            <RequiredLabel>マニュアルの有無</RequiredLabel>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="あり"
                  {...register('manualAvailability')}
                  className="mr-2 accent-[#2691DE]"
                />
                あり
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="なし"
                  {...register('manualAvailability')}
                  className="mr-2 accent-[#2691DE]"
                />
                なし
              </label>
            </div>
          </div>
          <div>
            <RequiredLabel>遵守状況</RequiredLabel>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="完全遵守"
                  {...register('complianceStatus')}
                  className="mr-2 accent-[#2691DE]"
                />
                完全遵守
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="一部遵守"
                  {...register('complianceStatus')}
                  className="mr-2 accent-[#2691DE]"
                />
                一部遵守
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="未遵守"
                  {...register('complianceStatus')}
                  className="mr-2 accent-[#2691DE]"
                />
                未遵守
              </label>
            </div>
          </div>
          <div>
            <RequiredLabel>マニュアルの最終更新日</RequiredLabel>
            <Input
              type="date"
              {...register('manualLastUpdated', { valueAsDate: true })}
              className="calendar-icon w-auto max-w-xs cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 設備情報セクション */}
      <div>
        <h3 className="mb-3 text-xl font-medium text-gray-600">設備情報</h3>
        <div className="space-y-3">
          <div>
            <RequiredLabel>使用機械/設備名</RequiredLabel>
            <Input
              {...register('equipmentName')}
              placeholder="例：プレス機A-1"
              className="w-full"
            />
          </div>
          <div>
            <RequiredLabel>導入年</RequiredLabel>
            <Input {...register('installationYear')} placeholder="例：2018年" className="w-full" />
          </div>
          <div>
            <RequiredLabel>最終点検日</RequiredLabel>
            <Input
              type="date"
              {...register('lastInspectionDate')}
              className="calendar-icon w-auto max-w-xs cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
          <div>
            <RequiredLabel>メンテナンス履歴</RequiredLabel>
            <Textarea
              {...register('maintenanceHistory')}
              placeholder="例：2024年1月 - 定期点検実施"
              className="w-full"
              rows={3}
            />
          </div>
          <div>
            <RequiredLabel>機械の不具合歴</RequiredLabel>
            <Textarea
              {...register('equipmentMalfunctionHistory')}
              placeholder="例：2023年12月 - 安全装置故障"
              className="w-full"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
