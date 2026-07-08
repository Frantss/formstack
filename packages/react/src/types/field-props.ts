import type { UseFieldReturn } from '#types/use-field-return';
import type { AnyFormApi, FieldOptions, FormIssueLevels, FormFields, FormFieldValue } from 'oxform-core';

export type FieldProps<Form extends AnyFormApi, Name extends FormFields<Form>> = FieldOptions<Form, Name> & {
  children:
    | React.ReactNode
    | ((field: UseFieldReturn<FormFieldValue<Form, Name>, FormIssueLevels<Form>>) => React.ReactNode);
};
