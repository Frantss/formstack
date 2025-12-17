import { defaultMeta, defaultStatus } from '#/core/field-api.constants';
import type {
  FieldMeta,
  FormBaseStore,
  FormIssue,
  FormOptions,
  FormStore,
  PersistedFieldMeta,
  PersistedFormStatus,
} from '#/core/field-api.types';
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

  constructor(options: FormOptions<Schema>) {
    this.options = options;

    this.persisted = new Store<FormBaseStore<Schema>>({
      values: mergeDeep(options.defaultValues as never, options.values ?? {}),
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
            const path = stringToPath(key);
            const value = get(persisted.values, path);
            const defaultValue = get(this.options.defaultValues, path);
            const invalid = persisted.errors[key]?.length > 0;

            return [
              key,
              {
                ...meta,
                default: isDeepEqual(value, defaultValue),
                pristine: !meta.dirty,
                valid: !invalid,
              } satisfies FieldMeta,
            ];
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

  public validate = async (field?: Field | Field[], options?: { type: 'change' | 'submit' | 'blur' | 'focus' }) => {
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
    const values = setPath(this.store.state.values as never, stringToPath(name as never) as any, value as never);
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
    return get(this.store.state.values as never, stringToPath(name as never)) as DeepValue<Values, Name>;
  };

  public meta = <Name extends Field>(name: Name) => {
    return this.store.state.fields[name as never] ?? defaultMeta;
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
}
