import type { FormIssuesByLevel } from '#types/api/form-issue-entry';
import type { FieldStatus } from '#types/api/field-status';

export type FieldState<Level extends string = string> = {
  id: string;
  status: FieldStatus<Level>;
  issues: FormIssuesByLevel<Level>;
  ref: HTMLElement | null;
};
