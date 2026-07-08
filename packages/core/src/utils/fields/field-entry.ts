import type { FormIssuesByLevelInput } from '#types/api/form-issue-entry';
import type { PersistedFieldStatus } from '#types/internal/persisted-field-status';

export type FieldEntry<Level extends string = string> = {
  id: string;
  status: PersistedFieldStatus;
  issues: FormIssuesByLevelInput<Level>;
  ref: HTMLElement | null;
};
