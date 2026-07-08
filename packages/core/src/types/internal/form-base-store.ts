import type { PersistedFields } from '#utils/fields';
import type { PersistedFormStatus } from '#types/internal/persisted-form-status';

export type FormBaseStore<Values, Level extends string = string> = {
  values: Values;
  fields: PersistedFields<Level>;
  status: PersistedFormStatus;
};
