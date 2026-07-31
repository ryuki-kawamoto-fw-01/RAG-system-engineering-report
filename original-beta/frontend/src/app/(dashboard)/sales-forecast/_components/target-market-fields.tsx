import { useRef, useState, useEffect } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { FormField, FormItem } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/sales-forecast';
import { INDUSTRY_GROUP, CUSTOMER_GROUPS, REGION_GROUPS } from '../_constant';
import { SalesForecastSchema } from '../_utils/schema';

export default function TargetMarketFields() {
  const { control, onChangeField } = useFormReduxContext<SalesForecastSchema>({
    setRedux: add,
  });

  // その他入力欄の状態管理
  const [industryOther, setIndustryOther] = useState(''); // 対象業界
  const [customerOther, setCustomerOther] = useState(''); // 対象顧客層
  const [regionOther, setRegionOther] = useState(''); // 対象地域

  useEffect(() => {
    setIndustryOther(control._defaultValues?.targetIndustryOther ?? '');
  }, [control._defaultValues?.targetIndustryOther]);
  useEffect(() => {
    setCustomerOther(control._defaultValues?.targetCustomersOther ?? '');
  }, [control._defaultValues?.targetCustomersOther]);
  useEffect(() => {
    setRegionOther(control._defaultValues?.targetRegionsOther ?? '');
  }, [control._defaultValues?.targetRegionsOther]);

  const industryOtherRef = useRef<HTMLInputElement>(null);
  const customerOtherRef = useRef<HTMLInputElement>(null);
  const regionOtherRef = useRef<HTMLInputElement>(null);

  // チェックボックスのON/OFF
  function handleCheck({
    value,
    field,
    name,
    opt,
    checked,
    onChangeField,
    otherLabel,
    otherInputRef,
  }: {
    value: string[];
    field: ControllerRenderProps<SalesForecastSchema, keyof SalesForecastSchema>;
    name: keyof SalesForecastSchema;
    opt: string;
    checked: boolean;
    onChangeField: (v: Partial<SalesForecastSchema>) => void;
    otherLabel?: string;
    otherInputRef?: React.RefObject<HTMLInputElement>;
  }) {
    const newValue = checked ? [...value, opt] : value.filter((v) => v !== opt);
    field.onChange(newValue);
    onChangeField({ [name]: newValue });

    if (otherLabel && opt === otherLabel && checked && otherInputRef && otherInputRef.current) {
      setTimeout(() => otherInputRef.current?.focus(), 0);
    }
  }

  // グループ単位の一括チェック
  function handleGroupCheck({
    value,
    field,
    name,
    groupOptions,
    checked,
    onChangeField,
  }: {
    value: string[];
    field: ControllerRenderProps<SalesForecastSchema, keyof SalesForecastSchema>;
    name: keyof SalesForecastSchema;
    groupOptions: string[];
    checked: boolean;
    onChangeField: (v: Partial<SalesForecastSchema>) => void;
  }) {
    const newValue = checked
      ? Array.from(new Set([...value, ...groupOptions]))
      : value.filter((v) => !groupOptions.includes(v));
    field.onChange(newValue);
    onChangeField({ [name]: newValue });
  }

  return (
    <div>
      {/* 対象業界（グルーピングなし、全て選択、その他は最後） */}
      <FormField
        control={control}
        name="targetIndustry"
        render={({ field }) => {
          const value: string[] = Array.isArray(field.value) ? field.value : [];
          const allChecked = INDUSTRY_GROUP.every((opt) => value.includes(opt));
          const someChecked = INDUSTRY_GROUP.some((opt) => value.includes(opt));
          const isIndeterminate = someChecked && !allChecked;
          const isOtherChecked = value.includes('その他の対象業界');

          return (
            <FormItem>
              <h2 className="mb-4 text-lg font-bold">対象市場</h2>
              <RequiredLabel>対象業界</RequiredLabel>
              <div className="mb-2 flex items-center">
                <Checkbox
                  id="select-all-targetIndustry"
                  checked={allChecked}
                  indeterminate={isIndeterminate}
                  onCheckedChange={(checked) => {
                    const newValue = checked ? [...INDUSTRY_GROUP] : [];
                    field.onChange(newValue);
                    onChangeField({ targetIndustry: newValue });
                  }}
                />
                <label htmlFor="select-all-targetIndustry" className="ml-2 text-sm">
                  すべて選択
                </label>
              </div>
              <div className="ml-6 flex flex-wrap gap-4">
                {INDUSTRY_GROUP.filter((opt) => opt !== 'その他の対象業界').map((opt) => (
                  <div key={opt} className="mb-1 flex items-center">
                    <Checkbox
                      id={`targetIndustry-${opt}`}
                      checked={value.includes(opt)}
                      onCheckedChange={(checked) =>
                        handleCheck({
                          value,
                          field,
                          name: 'targetIndustry',
                          opt,
                          checked: checked === true,
                          onChangeField,
                        })
                      }
                    />
                    <label htmlFor={`targetIndustry-${opt}`} className="ml-2 text-sm">
                      {opt}
                    </label>
                  </div>
                ))}
                {/* その他 */}
                <div className="mb-1 flex items-center">
                  <Checkbox
                    id="targetIndustry-その他の対象業界"
                    checked={isOtherChecked}
                    onCheckedChange={(checked) =>
                      handleCheck({
                        value,
                        field,
                        name: 'targetIndustry',
                        opt: 'その他の対象業界',
                        checked: checked === true,
                        onChangeField,
                        otherLabel: 'その他の対象業界',
                        otherInputRef: industryOtherRef,
                      })
                    }
                  />
                  <label htmlFor="targetIndustry-その他の対象業界" className="ml-2 text-sm">
                    その他の対象業界
                  </label>
                  <Input
                    ref={industryOtherRef}
                    className="ml-2 w-80 min-w-48 max-w-full resize-x"
                    value={industryOther}
                    onChange={(e) => {
                      setIndustryOther(e.target.value);
                      onChangeField({ targetIndustryOther: e.target.value });
                    }}
                    disabled={!isOtherChecked}
                    placeholder="その他の内容を入力"
                  />
                </div>
              </div>
            </FormItem>
          );
        }}
      />

      {/* 対象顧客層（グルーピング＋一括チェック＋個別チェック＋その他） */}
      <FormField
        control={control}
        name="targetCustomers"
        render={({ field }) => {
          const value: string[] = Array.isArray(field.value) ? field.value : [];
          const isOtherChecked = value.includes('その他の対象顧客');
          return (
            <FormItem>
              <RequiredLabel>対象顧客層</RequiredLabel>
              <div className="ml-2 flex flex-col gap-2">
                {CUSTOMER_GROUPS.map((group) =>
                  group.label === 'その他の対象顧客' ? (
                    <div key={group.label} className="mb-1 flex items-center">
                      <Checkbox
                        id="targetCustomers-その他の対象顧客"
                        checked={isOtherChecked}
                        onCheckedChange={(checked) =>
                          handleCheck({
                            value,
                            field,
                            name: 'targetCustomers',
                            opt: 'その他の対象顧客',
                            checked: checked === true,
                            onChangeField,
                            otherLabel: 'その他の対象顧客',
                            otherInputRef: customerOtherRef,
                          })
                        }
                      />
                      <label htmlFor="targetCustomers-その他の対象顧客" className="ml-2 text-sm">
                        その他の対象顧客
                      </label>
                      <Input
                        ref={customerOtherRef}
                        className="ml-2 w-80 min-w-48 max-w-full resize-x"
                        value={customerOther}
                        onChange={(e) => {
                          setCustomerOther(e.target.value);
                          onChangeField({ targetCustomersOther: e.target.value });
                        }}
                        disabled={!isOtherChecked}
                        placeholder="その他の内容を入力"
                      />
                    </div>
                  ) : (
                    <div key={group.label}>
                      <div className="mb-1 flex items-center">
                        <Checkbox
                          id={`targetCustomers-group-${group.label}`}
                          checked={group.options.every((opt) => value.includes(opt))}
                          indeterminate={
                            group.options.some((opt) => value.includes(opt)) &&
                            !group.options.every((opt) => value.includes(opt))
                          }
                          onCheckedChange={(checked) =>
                            handleGroupCheck({
                              value,
                              field,
                              name: 'targetCustomers',
                              groupOptions: group.options,
                              checked: checked === true,
                              onChangeField,
                            })
                          }
                        />
                        <span className="ml-2 text-sm">{group.label}</span>
                      </div>
                      <div className="ml-6 flex flex-wrap gap-4">
                        {group.options.map((opt) => (
                          <div key={opt} className="mb-1 flex items-center">
                            <Checkbox
                              id={`targetCustomers-${opt}`}
                              checked={value.includes(opt)}
                              onCheckedChange={(checked) =>
                                handleCheck({
                                  value,
                                  field,
                                  name: 'targetCustomers',
                                  opt,
                                  checked: checked === true,
                                  onChangeField,
                                })
                              }
                            />
                            <label htmlFor={`targetCustomers-${opt}`} className="ml-2 text-sm">
                              {opt}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </FormItem>
          );
        }}
      />

      {/* 対象地域（グルーピング＋一括チェック＋個別チェック＋その他） */}
      <FormField
        control={control}
        name="targetRegions"
        render={({ field }) => {
          const value: string[] = Array.isArray(field.value) ? field.value : [];
          const isOtherChecked = value.includes('その他の地域');
          return (
            <FormItem>
              <RequiredLabel>対象地域</RequiredLabel>
              <div className="ml-2 flex flex-col gap-2">
                {REGION_GROUPS.map((group) =>
                  group.label === 'その他の地域' ? (
                    <div key={group.label} className="mb-1 flex items-center">
                      <Checkbox
                        id="targetRegions-その他の地域"
                        checked={isOtherChecked}
                        onCheckedChange={(checked) =>
                          handleCheck({
                            value,
                            field,
                            name: 'targetRegions',
                            opt: 'その他の地域',
                            checked: checked === true,
                            onChangeField,
                            otherLabel: 'その他の地域',
                            otherInputRef: regionOtherRef,
                          })
                        }
                      />
                      <label htmlFor="targetRegions-その他の地域" className="ml-2 text-sm">
                        その他の地域
                      </label>
                      <Input
                        ref={regionOtherRef}
                        className="ml-2 w-80 min-w-48 max-w-full resize-x"
                        value={regionOther}
                        onChange={(e) => {
                          setRegionOther(e.target.value);
                          onChangeField({ targetRegionsOther: e.target.value });
                        }}
                        disabled={!isOtherChecked}
                        placeholder="その他の内容を入力"
                      />
                    </div>
                  ) : (
                    <div key={group.label}>
                      <div className="mb-1 flex items-center">
                        <Checkbox
                          id={`targetRegions-group-${group.label}`}
                          checked={group.options.every((opt) => value.includes(opt))}
                          indeterminate={
                            group.options.some((opt) => value.includes(opt)) &&
                            !group.options.every((opt) => value.includes(opt))
                          }
                          onCheckedChange={(checked) =>
                            handleGroupCheck({
                              value,
                              field,
                              name: 'targetRegions',
                              groupOptions: group.options,
                              checked: checked === true,
                              onChangeField,
                            })
                          }
                        />
                        <span className="ml-2 text-sm">{group.label}</span>
                      </div>
                      <div className="ml-6 flex flex-wrap gap-4">
                        {group.options.map((opt) => (
                          <div key={opt} className="mb-1 flex items-center">
                            <Checkbox
                              id={`targetRegions-${opt}`}
                              checked={value.includes(opt)}
                              onCheckedChange={(checked) =>
                                handleCheck({
                                  value,
                                  field,
                                  name: 'targetRegions',
                                  opt,
                                  checked: checked === true,
                                  onChangeField,
                                })
                              }
                            />
                            <label htmlFor={`targetRegions-${opt}`} className="ml-2 text-sm">
                              {opt}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </FormItem>
          );
        }}
      />
    </div>
  );
}
