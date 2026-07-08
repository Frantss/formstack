import type { FormIssuesByLevel } from '#types/api/form-issue-entry';

export type Fields<Level extends string = string> = Record<
  string,
  {
    id: string;
    status: {
      blurred: boolean;
      touched: boolean;
      dirty: boolean;
      default: boolean;
      valid: boolean;
      pristine: boolean;
    };
    issues: FormIssuesByLevel<Level>;
    ref: HTMLElement | null;
  }
>;
