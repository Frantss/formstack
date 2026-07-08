import type { PersistedFormStatus } from '#types/internal/persisted-form-status';
import type { Simplify } from 'type-fest';

export type FormStatus<_Level extends string = string> = Simplify<
  PersistedFormStatus & {
    submitted: boolean;
    valid: boolean;
    blurred: boolean;
    touched: boolean;
    pristine: boolean;
  }
>;
