import { useArrayField as useBaseArrayField } from '#use-array-field';
import { useField as useBaseField } from '#use-field';
import { useFieldApi as useBaseFieldApi } from '#use-field-api';
import { useForm as useBaseForm } from '#use-form';
import type { FormApi, FormArrayFields, FormChecksMap, FormFields, InferFormIssueLevels } from 'oxform-core';
import { useFormContext as useBaseFormContext } from './form-provider';

type DefineFormOptions<Values, Checks extends FormChecksMap<NoInfer<Values>, string> | undefined> = Parameters<
  typeof useBaseForm<Values, Checks>
>[0];

export const defineForm = <
  Values,
  const Checks extends FormChecksMap<NoInfer<Values>, string> | undefined = undefined,
>({
  options,
}: {
  options: DefineFormOptions<Values, Checks>;
}) => {
  type Level = InferFormIssueLevels<{ checks: Checks }>;
  type Form = FormApi<Values, Level>;

  const useForm = () => useBaseForm<Values, Checks>(options);

  const useFormContext = () => useBaseFormContext<Values, Level>(options as never);

  const useFieldApi = <Name extends FormFields<Form>>(name: Name) => {
    const form = useFormContext();
    return useBaseFieldApi({ form, name });
  };

  const useField = <Name extends FormFields<Form>>(name: Name) => {
    const form = useFormContext();
    return useBaseField({ form, name });
  };

  const useArrayField = <Name extends FormArrayFields<Form>>(name: Name) => {
    const form = useFormContext();
    return useBaseArrayField({ form, name });
  };

  return { useForm, useFormContext, useField, useFieldApi, useArrayField };
};
