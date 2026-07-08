import type { FormIssuesByLevelInput } from '#types/api/form-issue-entry';
import type { PersistedFieldStatus } from '#types/internal/persisted-field-status';

export type FieldSetOptions<Level extends string = string> = {
  status?: Partial<PersistedFieldStatus>;
  issues?: FormIssuesByLevelInput<Level>;
  ref?: HTMLElement | null;
};
