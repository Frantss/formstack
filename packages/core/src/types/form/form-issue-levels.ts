import type { FormIssuesByLevel } from '#types/api/form-issue-entry';
import type { AnyFormApi } from '#types/form/any-form-api';

export type FormIssueLevels<Form extends AnyFormApi> = Form extends {
  readonly '~issueLevels': infer Level;
}
  ? Extract<Level, string>
  : Form extends {
        field: {
          issues: (...args: any[]) => FormIssuesByLevel<infer Level>;
        };
      }
    ? Level
    : never;

type IssueLevelsFromChecks<Checks> = Checks extends object ? Extract<keyof NonNullable<Checks>, string> : never;

type FormOptionsIssueLevels<Options> = Options extends {
  checks?: unknown;
}
  ? IssueLevelsFromChecks<Options['checks']>
  : IssueLevelsFromChecks<Options extends { checks?: infer Checks } ? Checks : never>;

export type InferFormIssueLevels<Options> = [FormOptionsIssueLevels<Options>] extends [never]
  ? 'error'
  : 'error' | FormOptionsIssueLevels<Options>;
