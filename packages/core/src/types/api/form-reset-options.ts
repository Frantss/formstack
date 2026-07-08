import type { PersistedFormStatus } from '#types/internal/persisted-form-status';
import type { FormResetKeepOptions } from '#types/api/form-reset-keep-options';

export type FormResetOptions<Values, Level extends string = string> = {
  values?: Values;
  status?: Partial<PersistedFormStatus>;
  keep?: FormResetKeepOptions<Level>;
};
