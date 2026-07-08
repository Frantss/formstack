import type { FormStatus } from '#types/api/form-status';
import type { Fields as InternalFields } from '#types/internal/fields';

export type FormStore<Values, Level extends string = string> = {
  values: Values;
  fields: InternalFields<Level>;
  status: FormStatus<Level>;
};
