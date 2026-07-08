import type { FormCoreArray } from '#form/form-core-array-field';
import type { FormCoreField } from '#form/form-core-field';
import { FormApi } from '#form/form-api';
import type { FormChecksMap } from '#types/api/form-checks-map';
import type { FormOptions } from '#types/api/form-options';
import type { InferFormIssueLevels } from '#types/form/form-issue-levels';

type FormOptionsBase<Values, Level extends string> = Omit<FormOptions<Values, Level>, 'checks'>;

type CreateFormOptionsInput<
  Values,
  Checks extends FormChecksMap<NoInfer<Values>, string> | undefined,
> = FormOptionsBase<Values, string> & {
  checks?: Checks;
};

type InferredFormApi<Values, Level extends string> = Omit<
  FormApi<Values, string>,
  'field' | 'array' | 'options' | 'store' | 'status' | 'submit' | 'validate' | '~update'
> &
  Pick<
    FormApi<Values, Level>,
    'field' | 'array' | 'options' | 'store' | 'status' | 'submit' | 'validate' | '~update'
  > & {
    readonly '~issueLevels': Level;
    field: FormCoreField<Values, Level>;
    array: FormCoreArray<Values, Level>;
  };

export const createForm = <Values, const Checks extends FormChecksMap<NoInfer<Values>, string> | undefined = undefined>(
  options: CreateFormOptionsInput<Values, Checks>,
): InferredFormApi<Values, InferFormIssueLevels<{ checks: Checks }>> => {
  return new FormApi<Values, string>(options as FormOptions<Values, string>) as unknown as InferredFormApi<
    Values,
    InferFormIssueLevels<{ checks: Checks }>
  >;
};
