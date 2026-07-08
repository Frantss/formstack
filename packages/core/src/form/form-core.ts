import type {
  FormIssueEntry,
  FormIssueLevel,
  FormIssuesByLevel,
  FormIssuesByLevelInput,
} from '#types/api/form-issue-entry';
import { DEFAULT_FORM_STATUS } from '#constants';
import type { FormIssue } from '#types/api/form-issue';
import type { FormOptions } from '#types/api/form-options';
import type { FormResetOptions } from '#types/api/form-reset-options';
import type { FormStore } from '#types/api/form-store';
import type { ValidateOptions } from '#types/api/validate-options';
import type { ValidationType } from '#types/api/validation-type';
import type { DeepKeys } from '#types/deep';
import type { FormBaseStore } from '#types/internal/form-base-store';
import { fields_build, fields_pathWithRoot, fields_root } from '#utils/fields';
import {
  ERROR_ISSUE_LEVEL,
  issues_empty,
  issues_filter,
  issues_hasBlocking,
  issues_merge,
  issues_normalize,
} from '#utils/issues';
import { checksEngine_issueLevels, checksEngine_validationPlan } from '#utils/checks-issues-engine';
import { get } from '#utils/get';
import { update } from '#utils/update';
import type { Updater } from '#utils/update/updater-';
import { createStore, type ReadonlyStore, type Store } from '@tanstack/store';
import { entries, fromEntries, isDeepEqual, isFunction, map, pipe, setPath, stringToPath } from 'remeda';

export class FormCore<Values, Level extends string = string> {
  public options!: FormOptions<Values, Level>;
  public persisted: Store<FormBaseStore<Values, Level>>;
  public store!: ReadonlyStore<FormStore<Values, Level>>;
  private activeValidations = 0;
  private validationLanes = new Map<string, { sequence: number; targets?: string[] }>();

  constructor(options: FormOptions<Values, Level>) {
    this.options = options;

    this.persisted = createStore<FormBaseStore<Values, Level>>({
      values: options.defaultValues,
      fields: fields_build(options),
      status: {
        ...DEFAULT_FORM_STATUS,
        ...this.options.defaultStatus,
      },
    });

    this.store = createStore<FormStore<Values, Level>>(() => {
      const persisted = this.persisted.state;
      const root = persisted.fields[fields_root];
      const invalid = Object.values(persisted.fields).some(field => this.hasInvalidField(field));
      const fields = pipe(
        persisted.fields,
        entries(),
        map(([key, field]) => {
          const path = key === fields_root ? [] : stringToPath(key.slice(fields_root.length + 1));
          const value = get(persisted.values as never, path);
          const defaultValue = get(this.options.defaultValues, path);

          return [
            key,
            {
              ...field,
              status: {
                ...field.status,
                default: isDeepEqual(value, defaultValue),
                valid: !this.hasInvalidField(field),
                pristine: !field.status.dirty,
              },
            },
          ] as const;
        }),
        fromEntries(),
      ) as never;

      return {
        values: persisted.values,
        fields,
        status: {
          ...persisted.status,
          submitted: persisted.status.submits > 0,
          valid: !invalid,
          dirty: persisted.status.dirty || root.status.dirty,
          blurred: root.status.blurred,
          touched: root.status.touched,
          pristine: !root.status.dirty,
        },
      };
    });
  }

  private issueLevels = () => checksEngine_issueLevels(this.options);

  private issuesHaveBlocking = (issues: FormIssuesByLevelInput<Level>) => {
    return issues_hasBlocking(issues, this.options);
  };

  private hasInvalidField = (field: { issues: FormIssuesByLevelInput<Level> }) => {
    return this.issuesHaveBlocking(field.issues);
  };

  public valid = () => {
    return !Object.values(this.persisted.state.fields).some(field => this.hasInvalidField(field));
  };

  public currentIssues = () => {
    const issues = issues_merge(
      Object.values(this.persisted.state.fields).map(field => field.issues),
      this.issueLevels(),
    );

    return issues;
  };

  public updateOptions = (options: FormOptions<Values, Level>) => {
    const previousDefaultValues = this.options.defaultValues;
    this.options = options;
    const issueLevels = this.issueLevels();

    this.persisted.setState(state => {
      let changed = !isDeepEqual(previousDefaultValues, options.defaultValues);
      const fields = Object.fromEntries(
        Object.entries(state.fields).map(([path, field]) => {
          const issues = issues_normalize(field.issues, issueLevels);
          if (!isDeepEqual(issues, field.issues as never)) changed = true;

          return [
            path,
            {
              ...field,
              issues,
            },
          ];
        }),
      );

      if (!changed) return state;

      return {
        ...state,
        fields,
      };
    });
  };

  private setValidating = (validating: boolean) => {
    this.persisted.setState(state => {
      if (state.status.validating === validating) return state;

      return {
        ...state,
        status: {
          ...state.status,
          validating,
        },
      };
    });
  };

  private beginValidation = () => {
    this.activeValidations += 1;
    if (this.activeValidations === 1) this.setValidating(true);
  };

  private endValidation = () => {
    this.activeValidations = Math.max(this.activeValidations - 1, 0);
    if (this.activeValidations === 0) this.setValidating(false);
  };

  private validationLaneKey = (
    kind: 'errors' | 'issues',
    targets: string[] | undefined,
    type: ValidationType | undefined,
  ) => {
    const targetKey = targets ? [...targets].sort().join('|') : '*';
    const typeKey = type ?? '*';

    return `${kind}:${typeKey}:${targetKey}`;
  };

  private bumpValidationLane = (key: string, targets?: string[]) => {
    const lane = this.validationLanes.get(key);
    const sequence = (lane?.sequence ?? 0) + 1;

    this.validationLanes.set(key, {
      sequence,
      targets: targets ? [...targets] : undefined,
    });

    return sequence;
  };

  private beginValidationLane = (
    kind: 'errors' | 'issues',
    targets: string[] | undefined,
    type: ValidationType | undefined,
  ) => {
    const key = this.validationLaneKey(kind, targets, type);
    const sequence = this.bumpValidationLane(key, targets);

    return () => this.validationLanes.get(key)?.sequence === sequence;
  };

  private pathsOverlap = (left: string, right: string) => {
    return left === right || left.startsWith(`${right}.`) || right.startsWith(`${left}.`);
  };

  private invalidateValidationLanes = (path?: string) => {
    const changedPath = path ? fields_pathWithRoot(path) : undefined;

    for (const [key, lane] of this.validationLanes) {
      const shouldInvalidate =
        changedPath === undefined ||
        lane.targets === undefined ||
        lane.targets.some(target => this.pathsOverlap(target, changedPath));

      if (!shouldInvalidate) continue;

      this.validationLanes.set(key, {
        ...lane,
        sequence: lane.sequence + 1,
      });
    }
  };

  public set = (name: string, updater: Updater<unknown>) => {
    const path = stringToPath(name);
    this.invalidateValidationLanes(name);

    this.persisted.setState(state => {
      return {
        ...state,
        values: setPath(state.values as never, path as never, update(updater, get(state.values, path)) as never),
      };
    });
  };

  public validate = async <const Name extends DeepKeys<Values>>(
    fields?: Name | Name[],
    options?: ValidateOptions,
  ): Promise<[boolean, FormIssuesByLevel<Level>]> => {
    const validationType = options?.type;
    const {
      entries: validationEntries,
      errorEntries: errorValidationEntries,
      replacementTypes,
    } = checksEngine_validationPlan(this.options, validationType);
    const issueLevels = checksEngine_issueLevels(this.options);
    const targets = fields
      ? (Array.isArray(fields) ? fields : [fields]).map(field => fields_pathWithRoot(field))
      : undefined;
    const isCurrentValidation = this.beginValidationLane('issues', targets, validationType);
    const hasErrorValidation = errorValidationEntries.length > 0;

    if (validationEntries.length === 0) {
      this.persisted.setState(state => {
        const updatedFields = { ...state.fields };

        for (const [path, field] of Object.entries(state.fields)) {
          const shouldUpdate = !targets || targets.some(target => path === target || path.startsWith(`${target}.`));
          if (!shouldUpdate) continue;

          updatedFields[path] = {
            ...field,
            issues: issues_filter(
              field.issues,
              issue => {
                return (
                  issue.level === ERROR_ISSUE_LEVEL ||
                  issue.type === undefined ||
                  !replacementTypes.includes(issue.type)
                );
              },
              issueLevels,
            ),
          };
        }

        return {
          ...state,
          fields: updatedFields,
        };
      });

      return [true, issues_empty(issueLevels)];
    }

    const validations = validationEntries.map(async ({ type, level, schemaOrBuilder }) => {
      const schema = (
        isFunction(schemaOrBuilder)
          ? (schemaOrBuilder as (store: FormStore<Values, Level>) => unknown)(this.store.state)
          : schemaOrBuilder!
      ) as {
        '~standard': {
          validate: (input: Values) => { issues?: FormIssue[] } | Promise<{ issues?: FormIssue[] }>;
        };
      };
      const result = schema['~standard'].validate(this.store.state.values);

      if (result instanceof Promise) {
        this.beginValidation();
        const resolved = await result.finally(() => {
          this.endValidation();
        });
        return {
          type,
          level,
          issues: resolved.issues ?? [],
        };
      }

      return {
        type,
        level,
        issues: result.issues ?? [],
      };
    });

    const issues = await Promise.all(validations);

    if (!isCurrentValidation()) return [true, issues_empty(issueLevels)];

    const grouped: Record<string, FormIssuesByLevelInput<Level>> = {};
    let emitted = issues_empty(issueLevels);

    for (const result of issues) {
      for (const issue of result.issues) {
        const issuePath =
          !issue.path || issue.path.length === 0 ? fields_root : `${fields_root}.${issue.path.join('.')}`;

        const shouldInclude =
          !targets || targets.some(target => issuePath === target || issuePath.startsWith(`${target}.`));
        if (!shouldInclude) continue;

        const entry = {
          ...(result.type === undefined ? {} : { type: result.type }),
          level: result.level,
          issue,
        } as FormIssueEntry<FormIssueLevel<Level>>;
        const bucket = { [result.level]: [entry] } as FormIssuesByLevelInput<Level>;

        grouped[issuePath] = issues_merge([grouped[issuePath] ?? {}, bucket]);
        emitted = issues_merge([emitted, bucket], issueLevels);
      }
    }

    this.persisted.setState(state => {
      const updatedFields = { ...state.fields };

      for (const [path, field] of Object.entries(state.fields)) {
        const shouldUpdate = !targets || targets.some(target => path === target || path.startsWith(`${target}.`));
        if (!shouldUpdate) continue;
        const issuesToKeep = issues_filter(
          field.issues,
          issue => {
            if (issue.level === ERROR_ISSUE_LEVEL) return !hasErrorValidation;

            return issue.type === undefined || !replacementTypes.includes(issue.type);
          },
          issueLevels,
        );

        updatedFields[path] = {
          ...field,
          issues: issues_merge([issuesToKeep, grouped[path] ?? {}], issueLevels),
        };
      }

      return {
        ...state,
        fields: updatedFields,
      };
    });

    const hasBlockingIssues = this.issuesHaveBlocking(emitted);

    return [!hasBlockingIssues, emitted] as const;
  };

  public reset = (options?: FormResetOptions<Values, Level>) => {
    this.invalidateValidationLanes();
    this.persisted.setState(current => {
      const values = options?.values ?? this.options.defaultValues;
      const issueLevels = this.issueLevels();
      let fields = options?.keep?.fields ? current.fields : fields_build(this.options, values);

      if (!options?.keep?.fields && (options?.keep?.issues || options?.keep?.refs)) {
        const merged = { ...fields };

        for (const key of Object.keys(fields)) {
          const existing = current.fields[key];
          if (!existing) continue;
          const keepIssues = options.keep.issues;

          merged[key] = {
            ...fields[key],
            issues:
              keepIssues === true
                ? existing.issues
                : Array.isArray(keepIssues)
                  ? issues_filter(existing.issues, issue => keepIssues.includes(issue.level), issueLevels)
                  : fields[key].issues,
            ref: options.keep.refs ? existing.ref : fields[key].ref,
          };
        }

        fields = merged;
      }

      return {
        values,
        fields,
        status: {
          ...DEFAULT_FORM_STATUS,
          ...this.options.defaultStatus,
          ...options?.status,
        },
      };
    });
  };
}
