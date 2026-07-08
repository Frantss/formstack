import type { FormIssueLevel } from '#types/api/form-issue-entry';

export type FieldResetKeepOptions<Level extends string = string> = {
  issues?: true | FormIssueLevel<Level>[];
  refs?: boolean;
  status?: boolean;
};
