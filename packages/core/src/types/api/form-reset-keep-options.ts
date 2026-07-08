import type { FormIssueLevel } from '#types/api/form-issue-entry';

export type FormResetKeepOptions<Level extends string = string> = {
  /** Keep current field issues */
  issues?: true | FormIssueLevel<Level>[];
  /** Keep current references to html input elements */
  refs?: boolean;
  /** Keep current field status */
  fields?: boolean;
};
