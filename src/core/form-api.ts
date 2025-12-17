import { defaultMeta, defaultStatus } from '#/core/field-api.constants';
import type {
  FieldMeta,
  FieldSetErrorOptions,
  FormBaseStore,
  FormIssue,
  FormOptions,
  FormStore,
  PersistedFieldMeta,
  PersistedFormStatus,
  ValidateOptions
} from '#/core/form-api.types';
import type { DeepKeys, DeepValue } from '#/core/more-types';
import type { SchemaLike, StandardSchema } from '#/core/types';
import { get } from '#/utils/get';
import { validate } from '#/utils/validate';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { Derived, Store } from '@tanstack/store';
import { isDeepEqual, isFunction, mergeDeep, setPath, stringToPath } from 'remeda';

export class FormApi<
  Schema extends SchemaLike,
  Values extends StandardSchemaV1.InferInput<Schema> = StandardSchemaV1.InferInput<Schema>,
  Field extends DeepKeys<Values> = DeepKeys<Values>,
> {
  public options!: FormOptions<Schema>;
  private persisted: Store<FormBaseStore<Schema>>;
  public store!: Derived<FormStore<Schema>>;
  private initialValues: Values;

  constructor(options: FormOptions<Schema>) {
    this.options = options;
    this.initialValues = mergeDeep(options.defaultValues as never, options.values ?? {}) as Values;

    this.persisted = new Store<FormBaseStore<Schema>>({
      values: this.initialValues,
      fields: {},
      refs: {},
      status: defaultStatus,
      errors: {},
    });

    this.store = new Derived<FormStore<Schema>>({
      deps: [this.persisted],
      fn: ({ currDepVals }) => {
        const persisted = currDepVals[0] as FormBaseStore<Schema>;

        const invalid = Object.values(persisted.errors).some(issues => issues.length > 0);
        const dirty = Object.values(persisted.fields).some(meta => meta.dirty);
        const fields = Object.fromEntries(
          Object.entries(persisted.fields).map(([key, meta]) => {
            return [key, this.computeFieldMeta(key, meta, persisted.values as Values, persisted.errors)];
          }),
        );

        return {
          ...persisted,
          fields,
          status: {
            ...persisted.status,
            submitted: persisted.status.submits > 0,
            valid: !invalid,
            dirty: persisted.status.dirty || dirty,
          },
        };
      },
    });
  }

  public '~mount' = () => {
    const unsubscribe = this.store.mount();

    return unsubscribe;
  };

  public '~update' = (options: FormOptions<Schema>) => {
    this.options = options;
  };

  public get status() {
    return this.store.state.status;
  }

  public get values() {
    return this.store.state.values;
  }

  private get validator() {
    const store = this.store.state;
    const validate = this.options.validate;

    return {
      change: isFunction(validate?.change) ? validate.change(store) : validate?.change,
      submit: isFunction(validate?.submit) ? validate.submit(store) : (validate?.submit ?? this.options.schema),
      blur: isFunction(validate?.blur) ? validate.blur(store) : validate?.blur,
      focus: isFunction(validate?.focus) ? validate.focus(store) : validate?.focus,
    };
  }

  public validate = async (field?: Field | Field[], options?: ValidateOptions) => {
    const validator = options?.type ? this.validator[options.type] : this.options.schema;

    if (!validator) return [];

    this.setStatus({ validating: true });

    const { issues: allIssues } = await validate(validator, this.store.state.values);
    const fields = field ? (Array.isArray(field) ? field : [field]) : undefined;

    const issues = (allIssues ?? []).filter(issue => {
      const path = issue.path?.join('.') ?? 'root';
      return !fields || fields.includes(path as never);
    });

    const errors = issues.reduce((acc, issue) => {
      const path = issue.path?.join('.') ?? 'root';
      return {
        ...acc,
        [path]: [...(acc[path] ?? []), issue],
      };
    }, {} as any);

    this.persisted.setState(current => {
      // existing errors from non validated fields
      const existing = Object.fromEntries(
        Object.entries(current.errors).filter(([key]) => !fields?.includes(key as never)),
      );

      return {
        ...current,
        errors: {
          ...(fields ? existing : {}), // when validating a specific set of fields, keep the existing errors
          ...errors,
        },
      };
    });

    this.setStatus({ validating: false });

    return issues;
  };

  private computeFieldMeta = (
    fieldName: string,
    persistedMeta: PersistedFieldMeta | undefined,
    values: Values,
    errors: Record<string, FormIssue[]>,
  ): FieldMeta => {
    const path = stringToPath(fieldName);
    const value = get(values as never, path);
    const defaultValue = get(this.options.defaultValues, path);
    const invalid = errors[fieldName]?.length > 0;
    const baseMeta = persistedMeta ?? defaultMeta;

    return {
      ...baseMeta,
      default: isDeepEqual(value, defaultValue),
      pristine: !baseMeta.dirty,
      valid: !invalid,
    } satisfies FieldMeta;
  };

  private setFieldMeta = (name: string, meta: Partial<PersistedFieldMeta>) => {
    this.persisted.setState(current => {
      return {
        ...current,
        fields: {
          ...current.fields,
          [name]: {
            ...defaultMeta,
            ...this.persisted.state.fields[name],
            ...meta,
          },
        },
      };
    });
  };

  private setStatus = (status: Partial<PersistedFormStatus>) => {
    this.persisted.setState(current => {
      return {
        ...current,
        status: {
          ...current.status,
          ...status,
        },
      };
    });
  };

  public change = <Name extends Field>(name: Name, value: DeepValue<Values, Name>) => {
    const values = setPath(this.store.state.values as never, stringToPath(name) as never, value as never);
    this.persisted.setState(current => {
      return {
        ...current,
        values,
      };
    });

    this.setFieldMeta(name as never, { dirty: true, touched: true });
    void this.validate(name as never, { type: 'change' });
  };

  public focus = <Name extends Field>(name: Name) => {
    const ref = this.store.state.refs[name as never];

    if (ref) ref.focus();

    this.setFieldMeta(name as never, { touched: true });
    void this.validate(name as never, { type: 'focus' });
  };

  public blur = <Name extends Field>(name: Name) => {
    const ref = this.store.state.refs[name as never];

    if (ref) ref.blur();

    this.setFieldMeta(name as never, { blurred: true });
    void this.validate(name as never, { type: 'blur' });
  };

  public get = <Name extends Field>(name: Name) => {
    return get(this.store.state.values as never, stringToPath(name)) as DeepValue<Values, Name>;
  };

  public meta = <Name extends Field>(name: Name) => {
    const fieldMeta = this.store.state.fields[name];

    if (fieldMeta) return fieldMeta;

    return this.computeFieldMeta(name, undefined, this.store.state.values as Values, this.store.state.errors);
  };

  public register = <Name extends Field>(name: Name) => {
    return (element: HTMLElement | null) => {
      if (!element) return;

      this.persisted.setState(current => {
        return {
          ...current,
          refs: {
            ...current.refs,
            [name]: element,
          },
        };
      });
    };
  };

  public errors = <Name extends Field>(name: Name) => {
    return this.store.state.errors[name as never] ?? [];
  };

  public setErrors = <Name extends Field>(
    name: Name,
    errors: FormIssue[],
    options?: FieldSetErrorOptions,
  ) => {
    this.persisted.setState(current => {
      const existing = current.errors[name] ?? [];
      let updated: FormIssue[];

      switch (options?.mode) {
        case 'append':
          updated = [...existing, ...errors];
          break;
        case 'keep':
          updated = existing.length > 0 ? existing : errors;
          break;
        case 'replace':
        default:
          updated = errors;
          break;
      }

      return {
        ...current,
        errors: {
          ...current.errors,
          [name]: updated,
        },
      };
    });
  };

  public submit =
    (
      onSuccess: (data: StandardSchema.InferOutput<Schema>, form: typeof this) => void | Promise<void>,
      onError?: (issues: FormIssue[], form: typeof this) => void | Promise<void>,
    ) =>
    async () => {
      this.setStatus({ submitting: true, dirty: true });

      const issues = await this.validate(undefined, { type: 'submit' });
      const valid = issues.length === 0;

      if (valid) {
        await onSuccess(this.store.state.values as never, this);
      } else {
        await onError?.(issues, this);
      }

      this.setStatus({
        submits: this.persisted.state.status.submits + 1,
        submitting: false,
        successful: valid,
      });
    };

  public reset = (options?: {
    values?: Values;
    status?: Partial<PersistedFormStatus>;
    keep?: {
      /** Keep current field errors */
      errors?: boolean;
      /** Keep current references to html input elements */
      refs?: boolean;
      /** Keep current field metadata */
      fields?: boolean;
    };
  }) => {
    this.persisted.setState(current => {
      return {
        values: options?.values ?? this.options.defaultValues,
        fields: options?.keep?.fields ? current.fields : {},
        refs: options?.keep?.refs ? current.refs : {},
        errors: options?.keep?.errors ? current.errors : {},
        status: {
          ...defaultStatus,
          ...options?.status,
        },
      };
    });
  };

  public resetField = <Name extends Field>(
    name: Name,
    options?: {
      value?: DeepValue<Values, Name>;
      meta?: Partial<PersistedFieldMeta>;
      keep?: {
        errors?: boolean;
        refs?: boolean;
        meta?: boolean;
      };
    },
  ) => {
    const path = stringToPath(name as never);
    const defaultValue = get(this.options.defaultValues, path) as DeepValue<Values, Name>;
    const value = options?.value ?? defaultValue;

    this.persisted.setState(current => {
      const values = setPath(current.values as never, path as any, value as never);
      const fields = { ...current.fields };
      const refs = { ...current.refs };
      const errors = { ...current.errors };

      if (options?.meta) {
        const currentMeta = options?.keep?.meta ? (fields[name as string] ?? defaultMeta) : defaultMeta;
        fields[name as string] = {
          ...currentMeta,
          ...options.meta,
        };
      } else if (!options?.keep?.meta) delete fields[name as string];

      if (!options?.keep?.refs) delete refs[name as string];
      if (!options?.keep?.errors) delete errors[name as string];

      return {
        ...current,
        values,
        fields,
        refs,
        errors,
      };
    });
  };
}
