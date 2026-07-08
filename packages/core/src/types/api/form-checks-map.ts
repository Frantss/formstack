import type { FormStore } from '#types/api/form-store';
import type { ValidationType } from '#types/api/validation-type';
import type { StandardSchemaV1 as StandardSchema } from '@standard-schema/spec';
import type { PartialDeep } from 'type-fest';

export type FormCheckValidatorSchema<Values> = StandardSchema<PartialDeep<Values>>;
export type FormCheckValidatorFunction<Values, Level extends string = string> = (
  store: FormStore<Values, Level>,
) => FormCheckValidatorSchema<Values>;
export type FormCheckValidator<Values, Level extends string = string> =
  | FormCheckValidatorSchema<Values>
  | FormCheckValidatorFunction<Values, Level>;

export type FormChecksMap<Values, Level extends string = string> = Partial<
  Record<
    'error' | Level,
    {
      blocking?: boolean;
      validate?: Partial<Record<ValidationType, FormCheckValidator<Values, Level>>>;
    }
  >
>;
