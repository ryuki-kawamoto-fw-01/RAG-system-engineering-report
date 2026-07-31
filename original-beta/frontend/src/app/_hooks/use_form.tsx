import { ActionCreatorWithPayload, Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { Control, FieldValues, useForm, useFormContext, UseFormProps } from 'react-hook-form';
import { useAppDispatch } from '../_store/hooks';

type UseFormHooksProps = {
  setRedux?:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | ActionCreatorWithPayload<any, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | ((payload: any) => (dispatch: Dispatch<UnknownAction>) => Promise<void>);
};

export const useFormHooks = ({ setRedux }: UseFormHooksProps) => {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChangeField = (e: { [name: string]: any } | any) => {
    if (setRedux) {
      if (typeof e === 'object') {
        dispatch(setRedux({ ...e }));
      } else {
        dispatch(setRedux(e));
      }
    }
  };

  return {
    onChangeField,
  };
};

type UseFormReduxContextProps = UseFormHooksProps & {};
export const useFormReduxContext = <TFieldValues extends FieldValues = FieldValues>({
  setRedux,
}: UseFormReduxContextProps) => {
  const form = useFormContext<TFieldValues>();
  const hooks = useFormHooks({
    setRedux,
  });

  return {
    ...form,
    ...hooks,
  };
};

type UseFormReduxProps = UseFormHooksProps & {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFormRedux = <TFieldValues extends FieldValues = FieldValues, TContext = any>({
  setRedux,
  ...reactHooksFormProps
}: UseFormReduxProps & UseFormProps<TFieldValues, TContext>) => {
  const form = useForm({
    ...reactHooksFormProps,
  });
  const hooks = useFormHooks({
    setRedux,
  });

  return {
    ...form,
    ...hooks,
  };
};

export const useFieldArray = <TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  setRedux,
}: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: Control<TFieldValues, any>;
} & UseFormHooksProps) => {
  const dispatch = useAppDispatch();
  const remove = (index: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr = control?._getFieldArray(name) as any[];
    if (setRedux) {
      dispatch(
        setRedux({
          [name]: arr.filter((_, i) => i !== index),
        })
      );
    }
  };
  const append = (value: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr = control?._getFieldArray(name) as any[];
    if (setRedux) {
      // 配列の要素を追加する際は、既存の配列に新しい要素を追加
      const currentArray = Array.isArray(arr) ? arr : [];
      dispatch(
        setRedux({
          [name]: value instanceof FileList ? value : [...currentArray, value],
        })
      );
    }
  };

  return {
    remove,
    append,
  };
};
