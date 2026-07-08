import type { FormChecksMap } from '#types/api/form-checks-map';
import type { FormOptions } from '#types/api/form-options';
import type { InferFormIssueLevels } from '#types/form/form-issue-levels';

type FormOptionsBase<Values, Level extends string> = Omit<FormOptions<Values, Level>, 'checks'>;

type FormOptionsInput<Values, Checks extends FormChecksMap<NoInfer<Values>, string> | undefined> = FormOptionsBase<
  Values,
  string
> & {
  checks?: Checks;
};

export const formOptions = <
  Values,
  const Checks extends FormChecksMap<NoInfer<Values>, string> | undefined = undefined,
>(
  options: FormOptionsInput<Values, Checks>,
): FormOptions<Values, InferFormIssueLevels<{ checks: Checks }>> => {
  return options as FormOptions<Values, InferFormIssueLevels<{ checks: Checks }>>;
};
