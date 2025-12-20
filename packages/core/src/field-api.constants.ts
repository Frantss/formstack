import type { PersistedFieldMeta, PersistedFormStatus } from '#form-api.types';

export const defaultMeta = {
  blurred: false,
  touched: false,
  dirty: false,
} satisfies PersistedFieldMeta;

export const defaultStatus = {
  submits: 0,
  submitting: false,
  validating: false,
  successful: false,
  dirty: false,
} satisfies PersistedFormStatus;
