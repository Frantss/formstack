import { DEFAULT_FORM_STATUS } from '#constants';
import type { FormIssue } from '#types/api/form-issue';
import type { FormOptions } from '#types/api/form-options';
import type { FormResetOptions } from '#types/api/form-reset-options';
import type { FormStore } from '#types/api/form-store';
import type { ValidateOptions } from '#types/api/validate-options';
import type { DeepKeys } from '#types/deep';
import type { FormBaseStore } from '#types/internal/form-base-store';
import { fields_build, fields_pathWithRoot, fields_root } from '#utils/fields';
import { get } from '#utils/get';
import { update } from '#utils/update';
import type { Updater } from '#utils/update/updater-';
import { createStore, type ReadonlyStore, type Store } from '@tanstack/store';
import { entries, fromEntries, isDeepEqual, isFunction, map, pipe, setPath, stringToPath } from 'remeda';

export class FormCore<Values> {
  public options!: FormOptions<Values>;
  public persisted: Store<FormBaseStore<Values>>;
  public store!: ReadonlyStore<FormStore<Values>>;

  constructor(options: FormOptions<Values>) {
    this.options = options;

    this.persisted = createStore<FormBaseStore<Values>>({
      values: options.defaultValues,
      fields: fields_build(options),
      status: {
        ...DEFAULT_FORM_STATUS,
        ...this.options.defaultStatus,
      },
    });

    this.store = createStore<FormStore<Values>>(() => {
      const persisted = this.persisted.state;

      const root = persisted.fields[fields_root];
      const invalid = Object.values(persisted.fields).some(field => field.errors.length > 0);
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
                valid: field.errors.length === 0,
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

  public set = (name: string, updater: Updater<unknown>) => {
    const path = stringToPath(name);

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
  ): Promise<[boolean, FormIssue[]]> => {
    const schemaOrBuilder = options?.type
      ? (this.options.validate?.[options.type] ?? this.options.schema)
      : this.options.schema;
    const schema = isFunction(schemaOrBuilder) ? schemaOrBuilder(this.store.state) : schemaOrBuilder;
    const targets = fields
      ? (Array.isArray(fields) ? fields : [fields]).map(field => fields_pathWithRoot(field))
      : undefined;

    const validationResult = schema['~standard'].validate(this.store.state.values);
    const isAsyncValidation = validationResult instanceof Promise;

    if (isAsyncValidation) {
      this.persisted.setState(state => {
        return {
          ...state,
          status: {
            ...state.status,
            validating: true,
          },
        };
      });
    }

    const result = await validationResult;
    const allIssues = result.issues ?? [];
    const issues: FormIssue[] = [];
    const grouped: Record<string, FormIssue[]> = {};

    for (const issue of allIssues) {
      const issuePath = !issue.path || issue.path.length === 0 ? fields_root : `${fields_root}.${issue.path.join('.')}`;

      const shouldInclude =
        !targets || targets.some(target => issuePath === target || issuePath.startsWith(`${target}.`));
      if (!shouldInclude) continue;

      issues.push(issue);
      (grouped[issuePath] ??= []).push(issue);
    }

    this.persisted.setState(state => {
      const updatedFields = { ...state.fields };

      for (const [path, field] of Object.entries(state.fields)) {
        const shouldUpdate = !targets || targets.some(target => path === target || path.startsWith(`${target}.`));
        if (!shouldUpdate) continue;

        updatedFields[path] = {
          ...field,
          errors: grouped[path] ?? [],
        };
      }

      return isAsyncValidation
        ? {
            ...state,
            fields: updatedFields,
            status: {
              ...state.status,
              validating: false,
            },
          }
        : {
            ...state,
            fields: updatedFields,
          };
    });

    return [issues.length === 0, issues] as const;
  };

  public reset = (options?: FormResetOptions<Values>) => {
    this.persisted.setState(current => {
      const values = options?.values ?? this.options.defaultValues;
      let fields = options?.keep?.fields ? current.fields : fields_build(this.options, values);

      if (!options?.keep?.fields && (options?.keep?.errors || options?.keep?.refs)) {
        const merged = { ...fields };

        for (const key of Object.keys(fields)) {
          const existing = current.fields[key];
          if (!existing) continue;

          merged[key] = {
            ...fields[key],
            errors: options.keep.errors ? existing.errors : fields[key].errors,
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
