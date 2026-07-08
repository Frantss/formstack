import type { FormApi } from '#form/form-api';

export type FormSubmitSuccessHandler<Values, Level extends string = string> = (
  values: Values,
  form: FormApi<Values, Level>,
) => void | Promise<void>;
