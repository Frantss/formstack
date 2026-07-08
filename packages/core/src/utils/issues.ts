import type {
  FormIssueEntry,
  FormIssueLevel,
  FormIssuesByLevel,
  FormIssuesByLevelInput,
} from '#types/api/form-issue-entry';
import type { FormIssue } from '#types/api/form-issue';
import type { FormOptions } from '#types/api/form-options';
import type { ValidationType } from '#types/api/validation-type';

export const ERROR_ISSUE_LEVEL = 'error' as const;

type IssueBuckets<Level extends string = string> = FormIssuesByLevelInput<Level>;
type IssueItem<Level extends string = string> = FormIssueEntry<FormIssueLevel<Level>>;

export const checks_levelsFromOptions = <Level extends string>(
  options: Pick<FormOptions<any, Level>, 'checks'>,
): FormIssueLevel<Level>[] => {
  return [
    ERROR_ISSUE_LEVEL,
    ...Object.keys(options.checks ?? {}).filter(level => level !== ERROR_ISSUE_LEVEL),
  ] as FormIssueLevel<Level>[];
};

export const checks_hasValidator = <Level extends string>(
  options: Pick<FormOptions<any, Level>, 'checks'>,
  type: ValidationType,
): boolean => {
  const configs = Object.values(options.checks ?? {}) as NonNullable<FormOptions<any, Level>['checks']>[Level][];

  return configs.some(config => config?.validate?.[type] !== undefined);
};

export const issues_group = <Level extends string>(
  issues: IssueItem<Level>[],
  levels: FormIssueLevel<Level>[] = [],
): FormIssuesByLevel<Level> => {
  const grouped: Record<string, IssueItem<Level>[]> = {};

  for (const issue of issues) {
    (grouped[issue.level] ??= []).push(issue);
  }

  return issues_normalize(grouped as IssueBuckets<Level>, levels);
};

export const issues_empty = <Level extends string>(levels: FormIssueLevel<Level>[]): FormIssuesByLevel<Level> => {
  const issues: Record<string, IssueItem<Level>[]> = {};

  for (const level of levels) {
    issues[level] = [];
  }

  return issues as FormIssuesByLevel<Level>;
};

export const issues_normalize = <Level extends string>(
  issues: IssueBuckets<Level>,
  levels: FormIssueLevel<Level>[],
): FormIssuesByLevel<Level> => {
  const grouped: Record<string, IssueItem<Level>[]> = {};
  const configured = new Set<string>(levels);

  for (const [level, bucket] of Object.entries(issues) as [FormIssueLevel<Level>, IssueItem<Level>[]][]) {
    if (!configured.has(level) && bucket.length === 0) continue;

    grouped[level] = [...bucket];
  }

  for (const level of levels) {
    grouped[level] ??= [];
  }

  return grouped as FormIssuesByLevel<Level>;
};

export function issues_filter<Level extends string>(
  issues: IssueBuckets<Level>,
  predicate: (issue: IssueItem<Level>) => boolean,
  levels: FormIssueLevel<Level>[],
): FormIssuesByLevel<Level>;
export function issues_filter<Level extends string>(
  issues: IssueBuckets<Level>,
  predicate: (issue: IssueItem<Level>) => boolean,
): IssueBuckets<Level>;
export function issues_filter<Level extends string>(
  issues: IssueBuckets<Level>,
  predicate: (issue: IssueItem<Level>) => boolean,
  levels?: FormIssueLevel<Level>[],
): IssueBuckets<Level> {
  const filtered: Record<string, IssueItem<Level>[]> = {};

  for (const [level, bucket] of Object.entries(issues) as [FormIssueLevel<Level>, IssueItem<Level>[]][]) {
    const next = bucket.filter(predicate);

    if (next.length > 0) filtered[level] = next;
  }

  if (levels) return issues_normalize(filtered as IssueBuckets<Level>, levels);

  return filtered as IssueBuckets<Level>;
}

export function issues_merge<Level extends string>(
  issues: IssueBuckets<Level>[],
  levels: FormIssueLevel<Level>[],
): FormIssuesByLevel<Level>;
export function issues_merge<Level extends string>(issues: IssueBuckets<Level>[]): IssueBuckets<Level>;
export function issues_merge<Level extends string>(
  issues: IssueBuckets<Level>[],
  levels?: FormIssueLevel<Level>[],
): IssueBuckets<Level> {
  const merged: Record<string, IssueItem<Level>[]> = {};

  for (const current of issues) {
    for (const [level, bucket] of Object.entries(current) as [FormIssueLevel<Level>, IssueItem<Level>[]][]) {
      if (bucket.length === 0) continue;

      merged[level] = [...(merged[level] ?? []), ...bucket];
    }
  }

  if (levels) return issues_normalize(merged as IssueBuckets<Level>, levels);

  return merged as IssueBuckets<Level>;
}

export const issues_hasAny = <Level extends string>(issues: IssueBuckets<Level>): boolean => {
  return Object.values(issues).some(bucket => Array.isArray(bucket) && bucket.length > 0);
};

export const issues_hasBlocking = <Level extends string>(
  issues: IssueBuckets<Level>,
  options: Pick<FormOptions<any, Level>, 'checks'>,
): boolean => {
  if ((issues[ERROR_ISSUE_LEVEL]?.length ?? 0) > 0) return true;

  return Object.entries(issues).some(([level, bucket]) => {
    if (level === ERROR_ISSUE_LEVEL || bucket.length === 0) return false;

    return options.checks?.[level as Level]?.blocking === true;
  });
};

export const issues_fromIssues = <Level extends string>(
  level: FormIssueLevel<Level>,
  issues: FormIssue[],
  type?: ValidationType,
): IssueBuckets<Level> => {
  if (issues.length === 0) return {};

  return {
    [level]: issues.map(issue => ({
      ...(type === undefined ? {} : { type }),
      level,
      issue,
    })),
  } as IssueBuckets<Level>;
};
