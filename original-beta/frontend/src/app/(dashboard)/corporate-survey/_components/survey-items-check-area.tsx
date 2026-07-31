import { useEffect, useState } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useAppDispatch } from '@/app/_store/hooks';
import { setCorporateSurvey } from '@/app/_store/slice/corporate-survey';
import { cn } from '@/app/_utils/tw-merge';
import { Checkbox } from '../../../_components/ui/checkbox';
import { Label } from '../../../_components/ui/label';
import { surveyItemGroups, SURVEY_ITEMS, INDUSTRY_IT, CATEGORIES } from '../_constant';
import { CorporateSurvey } from '../_type';
import { IndustrySelect } from './industry-select-area';

type Props = {
  control: Control<CorporateSurvey>;
};

export default function SurveyItemsCheckArea({ control }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const storedIndustry = localStorage.getItem('selectedIndustry');
  const [selectedIndustry, setSelectedIndustry] = useState<string>(storedIndustry || INDUSTRY_IT);

  useEffect(() => {
    // localStorageに値が保存されている場合はその値を保持
    if (storedIndustry) {
      setSelectedIndustry(storedIndustry);
    }
  }, [storedIndustry]);

  return (
    <FormItem>
      <RequiredLabel>調査する情報</RequiredLabel>
      {surveyItemGroups.map((group) => (
        <div key={group.name} className="space-y-1">
          <div className="mb-2 flex items-center">
            <Controller
              name="selectedOptions"
              control={control}
              render={({ field }) => {
                // 全選択を判定
                const allSelected = group.items.every((item) =>
                  field.value!.some((option: string) =>
                    item === SURVEY_ITEMS.CHALLENGES.PROPOSALS
                      ? option.startsWith(SURVEY_ITEMS.CHALLENGES.PROPOSALS)
                      : option === item
                  )
                );

                // 一部選択を判定
                const someSelected = group.items.some((item) =>
                  field.value!.some((option: string) =>
                    item === SURVEY_ITEMS.CHALLENGES.PROPOSALS
                      ? option.startsWith(SURVEY_ITEMS.CHALLENGES.PROPOSALS)
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
                            ...field.value!,
                            ...group.items
                              .map((item) =>
                                item === SURVEY_ITEMS.CHALLENGES.PROPOSALS
                                  ? `${SURVEY_ITEMS.CHALLENGES.PROPOSALS} 当社の業界：${selectedIndustry}`
                                  : item
                              )
                              .filter((item) => !field.value!.includes(item)),
                          ]
                        : field.value!.filter((option: string) => {
                            const isGroupItem = group.items.some((item) =>
                              item === SURVEY_ITEMS.CHALLENGES.PROPOSALS
                                ? option.startsWith(SURVEY_ITEMS.CHALLENGES.PROPOSALS)
                                : option === item
                            );
                            return !isGroupItem;
                          });
                      field.onChange(updatedOptions);
                      dispatch(setCorporateSurvey({ selectedOptions: updatedOptions }));
                    }}
                  />
                );
              }}
            />
            <div className="ml-1.5 text-sm">{group.name}</div>
          </div>
          <div
            className={`ml-6 ${group.name === CATEGORIES.CHALLENGES ? 'grid grid-cols-1' : 'flex flex-wrap gap-x-6 gap-y-1.5'}`}
          >
            {group.items.map((item) => (
              <div
                key={item}
                className={cn(
                  'flex items-center',
                  item === SURVEY_ITEMS.CHALLENGES.PROPOSALS && 'items-start mt-1.5'
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
                          item === SURVEY_ITEMS.CHALLENGES.PROPOSALS
                            ? (field.value ?? []).some((option: string) =>
                                option.startsWith(SURVEY_ITEMS.CHALLENGES.PROPOSALS)
                              )
                            : (field.value ?? []).includes(item)
                        }
                        onCheckedChange={(checked: boolean) => {
                          let updatedOptions = field.value!;

                          if (checked) {
                            updatedOptions = [
                              ...field.value!,
                              item === SURVEY_ITEMS.CHALLENGES.PROPOSALS
                                ? `${SURVEY_ITEMS.CHALLENGES.PROPOSALS} 当社の業界：${selectedIndustry}`
                                : item,
                            ];
                          } else {
                            updatedOptions = field.value!.filter((option: string) =>
                              item === SURVEY_ITEMS.CHALLENGES.PROPOSALS
                                ? !option.startsWith(SURVEY_ITEMS.CHALLENGES.PROPOSALS)
                                : option !== item
                            );
                          }
                          field.onChange(updatedOptions);
                          dispatch(setCorporateSurvey({ selectedOptions: updatedOptions }));
                        }}
                      />
                      <Label htmlFor={`survey-${item}`} className="ml-1.5 text-sm">
                        {item}
                        {item === SURVEY_ITEMS.CHALLENGES.PROPOSALS && (
                          <div className="mt-1 flex items-center whitespace-nowrap">
                            当社の業界：
                            <div className="ml-3">
                              <IndustrySelect
                                selectedIndustry={
                                  (field.value ?? [])
                                    .find((option: string) =>
                                      option.startsWith(SURVEY_ITEMS.CHALLENGES.PROPOSALS)
                                    )
                                    ?.split('当社の業界：')[1] || selectedIndustry
                                }
                                onIndustryChange={(newIndustry) => {
                                  const updatedOptions = field.value!.map((option: string) =>
                                    option.startsWith(SURVEY_ITEMS.CHALLENGES.PROPOSALS)
                                      ? `${SURVEY_ITEMS.CHALLENGES.PROPOSALS} 当社の業界：${newIndustry}`
                                      : option
                                  );
                                  field.onChange(updatedOptions);
                                  dispatch(setCorporateSurvey({ selectedOptions: updatedOptions }));
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </Label>
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
