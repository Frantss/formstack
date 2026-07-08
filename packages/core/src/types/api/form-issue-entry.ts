import type { FormIssue } from '#types/api/form-issue';
import type { ValidationType } from '#types/api/validation-type';

export type FormErrorIssueLevel = 'error';
export type FormIssueLevel<Level extends string = string> = FormErrorIssueLevel | Level;

export type FormIssueEntry<Level extends string = string> = {
  type?: ValidationType;
  level: Level;
  issue: FormIssue;
};

export type FormIssuesByLevel<Level extends string = string> = {
  [Key in FormIssueLevel<Level>]: FormIssueEntry<Key>[];
};

export type FormIssuesByLevelInput<Level extends string = string> = Partial<FormIssuesByLevel<Level>> & {
  length?: never;
};
