import { useEffect, useState } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useAppDispatch } from '@/app/_store/hooks';
import { setCrisisManagementScenarios } from '@/app/_store/slice/crisis-management-scenarios';
import { CrisisManagementScenariosState } from '@/app/_store/slice/crisis-management-scenarios';
import { cn } from '@/app/_utils/tw-merge';
import { Checkbox } from '../../../_components/ui/checkbox';
import { Label } from '../../../_components/ui/label';
import { surveyItemGroups, RISK_ITEMS } from '../_constant';

type Props = {
  control: Control<CrisisManagementScenariosState>;
};

export default function RiskCategoryCheckArea({ control }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const storedIndustry = localStorage.getItem('selectedIndustry');
  const [selectedIndustry, setSelectedIndustry] = useState<string>(storedIndustry || '');

  useEffect(() => {
    // localStorageに値が保存されている場合はその値を保持
    if (storedIndustry) {
      setSelectedIndustry(storedIndustry);
    }
  }, [storedIndustry]);

  return (
    <FormItem>
      <RequiredLabel>リスクカテゴリ</RequiredLabel>
      {surveyItemGroups.map((group) => (
        <div key={group.name} className="space-y-1">
          <div className="mb-2 flex items-center">
            <Controller
              name="selectedOptions"
              control={control}
              render={({ field }) => {
                // 全選択を判定
                const allSelected = group.items.every((item) =>
                  (field.value ?? []).some((option: string) =>
                    item === RISK_ITEMS.RISK_CATEGPORY.INDUSTRY
                      ? option.startsWith(RISK_ITEMS.RISK_CATEGPORY.INDUSTRY)
                      : option === item
                  )
                );

                // 一部選択を判定
                const someSelected = group.items.some((item) =>
                  (field.value ?? []).some((option: string) =>
                    item === RISK_ITEMS.RISK_CATEGPORY.INDUSTRY
                      ? option.startsWith(RISK_ITEMS.RISK_CATEGPORY.INDUSTRY)
                      : option === item
                  )
                );

                const isIndeterminate = someSelected && !allSelected;

                return (
                  <Checkbox
                    id={`select-all-${group.name}`}
                    size="sm"
                    checked={allSelected}
                    indeterminate={isIndeterminate}
                    onCheckedChange={(checked: boolean) => {
                      const updatedOptions = checked
                        ? [
                            ...(field.value ?? []),
                            ...group.items
                              .map((item) =>
                                item === RISK_ITEMS.RISK_CATEGPORY.INDUSTRY
                                  ? `${RISK_ITEMS.RISK_CATEGPORY.INDUSTRY} リスクカテゴリ：${selectedIndustry}`
                                  : item
                              )
                              .filter((item) => !(field.value ?? []).includes(item)),
                          ]
                        : (field.value ?? []).filter((option: string) => {
                            const isGroupItem = group.items.some((item) =>
                              item === RISK_ITEMS.RISK_CATEGPORY.INDUSTRY
                                ? option.startsWith(RISK_ITEMS.RISK_CATEGPORY.INDUSTRY)
                                : option === item
                            );
                            return !isGroupItem;
                          });
                      field.onChange(updatedOptions);
                      dispatch(setCrisisManagementScenarios({ selectedOptions: updatedOptions }));
                    }}
                  />
                );
              }}
            />
            <div className="ml-1.5 text-sm">{group.name}</div>
          </div>
          <div
            className={cn(
              'ml-6 flex flex-wrap gap-x-6 gap-y-2' // 横並び・折り返し・間隔を追加
            )}
          >
            {group.items.map((item) => (
              <div
                key={item}
                className={cn(
                  'flex items-center h-[26px] gap-x-2', // 高さ・横間隔を追加
                  item === RISK_ITEMS.RISK_CATEGPORY.INDUSTRY && 'items-start mt-1.5'
                )}
              >
                <Controller
                  name="selectedOptions"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Checkbox
                        size="sm"
                        id={`survey-${item}`}
                        checked={
                          item === RISK_ITEMS.RISK_CATEGPORY.INDUSTRY
                            ? (field.value ?? []).some((option: string) =>
                                option.startsWith(RISK_ITEMS.RISK_CATEGPORY.INDUSTRY)
                              )
                            : (field.value ?? []).includes(item)
                        }
                        onCheckedChange={(checked: boolean) => {
                          let updatedOptions = field.value;
                          if (checked) {
                            updatedOptions = [
                              ...(field.value ?? []),
                              item === RISK_ITEMS.RISK_CATEGPORY.INDUSTRY
                                ? `${RISK_ITEMS.RISK_CATEGPORY.INDUSTRY} リスクカテゴリ：${selectedIndustry}`
                                : item,
                            ];
                          } else {
                            updatedOptions = (field.value ?? []).filter((option: string) =>
                              item === RISK_ITEMS.RISK_CATEGPORY.INDUSTRY
                                ? !option.startsWith(RISK_ITEMS.RISK_CATEGPORY.INDUSTRY)
                                : option !== item
                            );
                          }
                          field.onChange(updatedOptions);
                          dispatch(
                            setCrisisManagementScenarios({ selectedOptions: updatedOptions })
                          );
                        }}
                      />
                      <Label
                        htmlFor={`survey-${item}`}
                        className="ml-1.5 cursor-pointer text-sm font-normal"
                      >
                        {item}
                      </Label>
                      {item === RISK_ITEMS.RISK_CATEGPORY.INDUSTRY &&
                        (field.value ?? []).some((option: string) =>
                          option.startsWith(RISK_ITEMS.RISK_CATEGPORY.INDUSTRY)
                        )}
                    </>
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </FormItem>
  );
}
