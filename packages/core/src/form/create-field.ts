import { FieldApi } from '#form/field-api';
import type { FieldOptions } from '#types/api/field-options';
import type { AnyFormApi } from '#types/form/any-form-api';
import type { FormIssueLevels } from '#types/form/form-issue-levels';
import type { FormFieldValue } from '#types/form/form-field-value';
import type { FormFields } from '#types/form/form-fields';

export const createField = <Form extends AnyFormApi, const Name extends FormFields<Form>>(
  options: FieldOptions<Form, Name>,
) => {
  return new FieldApi(options) as unknown as FieldApi<FormFieldValue<Form, Name>, FormIssueLevels<Form>>;
};
