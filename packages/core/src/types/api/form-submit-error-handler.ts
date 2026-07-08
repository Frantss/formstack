import type { FormApi } from '#form/form-api';
import type { FormIssuesByLevel } from '#types/api/form-issue-entry';

export type FormSubmitErrorHandler<Values, Level extends string = string> = (
  issues: FormIssuesByLevel<Level>,
  form: FormApi<Values, Level>,
) => void | Promise<void>;
