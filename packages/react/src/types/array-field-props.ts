import type { AnyFormApi, ArrayLike, FieldOptions, FormArrayFields, FormFieldValue } from 'oxform-core';
import type { UseArrayFieldReturn } from '#types/use-array-field-return';

export type ArrayFieldProps<Form extends AnyFormApi, Name extends FormArrayFields<Form>> = FieldOptions<Form, Name> & {
  children: React.ReactNode | ((field: UseArrayFieldReturn<FormFieldValue<Form, Name> & ArrayLike>) => React.ReactNode);
};
