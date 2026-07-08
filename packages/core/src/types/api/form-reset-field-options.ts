import type { FieldResetKeepOptions } from '#types/api/field-reset-keep-options';
import type { FieldResetStatus } from '#types/api/field-reset-status';

export type FormResetFieldOptions<Value, Level extends string = string> = {
  value?: Value;
  status?: FieldResetStatus;
  keep?: FieldResetKeepOptions<Level>;
};
