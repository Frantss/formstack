import type { PersistedFieldStatus } from '#types/internal/persisted-field-status';
import type { Simplify } from 'type-fest';

export type FieldStatus<_Level extends string = string> = Simplify<
  PersistedFieldStatus & {
    default: boolean;
    valid: boolean;
    pristine: boolean;
  }
>;
