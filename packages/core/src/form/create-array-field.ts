import { ArrayFieldApi } from '#form/array-field-api';
import type { ArrayFieldOptions } from '#types/api/array-field-options';
import type { AnyFormApi } from '#types/form/any-form-api';
import type { FormArrayFields } from '#types/form/form-array-fields';
import type { FormIssueLevels } from '#types/form/form-issue-levels';
import type { FormFieldValue } from '#types/form/form-field-value';
import type { ArrayLike } from '#types/misc/array-like';

export const createArrayField = <Form extends AnyFormApi, const Name extends FormArrayFields<Form>>(
  options: ArrayFieldOptions<Form, Name>,
) => {
  return new ArrayFieldApi(options) as unknown as ArrayFieldApi<
    FormFieldValue<Form, Name> & ArrayLike,
    FormIssueLevels<Form>
  >;
};
