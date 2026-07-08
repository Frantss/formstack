import type { FormStore } from '#types/api/form-store';
import type { FormChecksMap } from '#types/api/form-checks-map';
import type { DeepKeys } from '#types/deep';
import type { PersistedFieldStatus } from '#types/internal/persisted-field-status';
import type { PersistedFormStatus } from '#types/internal/persisted-form-status';
import type { StandardSchemaV1 as StandardSchema } from '@standard-schema/spec';
import type { PartialDeep } from 'type-fest';

type FormValidatorSchema<Values> = StandardSchema<PartialDeep<Values>>;
type FormValidatorFunction<Values> = (store: FormStore<Values>) => FormValidatorSchema<Values>;
export type FormValidator<Values> = FormValidatorSchema<Values> | FormValidatorFunction<Values>;

export type FormOptions<Values, Level extends string = string> = {
  id?: string;
  schema: StandardSchema<Values>;
  defaultValues: NoInfer<Values>;
  defaultStatus?: Partial<PersistedFormStatus>;
  defaultFieldStatus?: Partial<Record<DeepKeys<Values> | '*', Partial<PersistedFieldStatus>>>;
  checks?: FormChecksMap<NoInfer<Values>, Level>;
};
