import { defaultMeta } from '#field-api.constants';
import type { FieldChangeOptions, FormIssue, FormResetFieldOptions, FormSetErrorsOptions } from '#form-api.types';
import type { FormContextApi } from '#form-context-api';
import type { DeepKeys, DeepValue } from '#more-types';
import type { StandardSchema } from '#types';
import { get } from '#utils/get';
import { update, type Updater } from '#utils/update';
import { batch } from '@tanstack/store';
import { setPath, stringToPath } from 'remeda';

export class FormFieldApi<
  Schema extends StandardSchema,
  Values extends StandardSchema.InferInput<Schema> = StandardSchema.InferInput<Schema>,
  Field extends DeepKeys<Values> = DeepKeys<Values>,
> {
  constructor(private context: FormContextApi<Schema>) {}

  /**
   * Changes the value of a specific field with optional control over side effects.
   * @param name - The name of the field to change
   * @param value - The new value to set for the field
   * @param options - Optional configuration for controlling validation, dirty state, and touched state
   */
  public change = <Name extends Field>(
    name: Name,
    updater: Updater<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    const shouldDirty = options?.should?.dirty !== false;
    const shouldTouch = options?.should?.touch !== false;
    const shouldValidate = options?.should?.validate !== false;

    this.context.persisted.setState(current => {
      const value = get(current.values as never, stringToPath(name)) as DeepValue<Values, Name>;

      const values = setPath(
        current.values as never,
        stringToPath(name) as never,
        update(updater, value) as never,
      ) as Values;

      return {
        ...current,
        values,
      };
    });

    if (shouldValidate) void this.context.validate(name, { type: 'change' });

    batch(() => {
      if (shouldDirty) this.context.setFieldMeta(name, { dirty: true });
      if (shouldTouch) this.context.setFieldMeta(name, { touched: true });
    });
  };

  public focus = <Name extends Field>(name: Name) => {
    const ref = this.context.store.state.refs[name as never];

    if (ref) ref.focus();

    this.context.setFieldMeta(name as never, { touched: true });
    void this.context.validate(name as never, { type: 'focus' });
  };

  public blur = <Name extends Field>(name: Name) => {
    const ref = this.context.store.state.refs[name as never];

    if (ref) ref.blur();

    this.context.setFieldMeta(name as never, { blurred: true });
    void this.context.validate(name as never, { type: 'blur' });
  };

  public get = <Name extends Field>(name: Name) => {
    return get(this.context.store.state.values as never, stringToPath(name)) as DeepValue<Values, Name>;
  };

  public meta = <Name extends Field>(name: Name) => {
    const meta = this.context.store.state.fields[name];

    if (meta) return meta;

    const updated = this.context.buildFieldMeta(
      name,
      undefined,
      this.context.store.state.values as Values,
      this.context.store.state.errors,
    );

    this.context.setFieldMeta(name, updated);

    return updated;
  };

  public register = <Name extends Field>(name: Name) => {
    return (element: HTMLElement | null) => {
      if (!element) return;

      this.context.persisted.setState(current => {
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
    return this.context.store.state.errors[name] ?? [];
  };

  public setErrors = <Name extends Field>(name: Name, errors: FormIssue[], options?: FormSetErrorsOptions) => {
    this.context.persisted.setState(current => {
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

  public reset = <Name extends Field>(name: Name, options?: FormResetFieldOptions<DeepValue<Values, Name>>) => {
    const path = stringToPath(name as never);
    const defaultValue = get(this.context.options.defaultValues, path) as DeepValue<Values, Name>;
    const value = options?.value ?? defaultValue;

    this.context.persisted.setState(current => {
      const values = setPath(current.values as never, path as never, value as never);
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
