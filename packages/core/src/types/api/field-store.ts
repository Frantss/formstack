import type { FieldState } from '#types/api/field-state';

export type FieldStore<Value, Level extends string = string> = {
  value: Value;
  defaultValue: Value;
} & FieldState<Level>;
