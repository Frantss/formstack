import type { FormApi } from '#form/form-api';

export type AnyFormApi = Pick<
  FormApi<any, any>,
  | 'id'
  | 'field'
  | 'array'
  | 'options'
  | 'store'
  | 'status'
  | 'values'
  | 'validate'
  | 'reset'
  | 'submit'
  | '~mount'
  | '~update'
> & {
  readonly '~issueLevels'?: string;
};
