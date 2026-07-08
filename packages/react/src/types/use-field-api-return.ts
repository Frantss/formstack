import type { AnyFormApi, FieldApi, FormIssueLevels, FormFields, FormFieldValue } from 'oxform-core';

export type UseFieldApiReturn<Form extends AnyFormApi, Name extends FormFields<Form>> = FieldApi<
  FormFieldValue<Form, Name>,
  FormIssueLevels<Form>
>;
