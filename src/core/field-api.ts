import type { FormApi } from '#/core/form-api';
import type {
  FieldChangeOptions,
  FieldMeta,
  FormIssue,
  FormResetFieldOptions,
  FormSetErrorsOptions,
  ValidateOptions,
} from '#/core/form-api.types';
import type { DeepKeys, DeepValue } from '#/core/more-types';
import type { EventLike, SchemaLike, StandardSchema } from '#/core/types';
import { get } from '#/utils/get';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { Derived } from '@tanstack/store';
import { stringToPath } from 'remeda';

export type FieldOptions<
  Schema extends SchemaLike,
  Name extends DeepKeys<StandardSchema.InferInput<Schema>> = DeepKeys<StandardSchema.InferInput<Schema>>,
> = {
  form: FormApi<Schema>;
  name: Name;
};

export type FieldStore<Value> = {
  value: Value;
  defaultValue: Value;
  meta: FieldMeta;
  errors: FormIssue[];
};

export type FieldProps<Value> = {
  defaultValue: Value;
  value: Value;
  ref: (element: HTMLElement | null) => void;
  onChange: (event: EventLike) => void;
  onBlur: (event: EventLike) => void;
  onFocus: (event: EventLike) => void;
};

export class FieldApi<
  Schema extends SchemaLike,
  Name extends DeepKeys<StandardSchemaV1.InferInput<Schema>>,
  in out Value extends DeepValue<StandardSchemaV1.InferInput<Schema>, Name>,
> {
  public options: FieldOptions<Schema, Name>;
  public form: FormApi<Schema>;
  public store: Derived<FieldStore<Value>>;

  constructor(options: FieldOptions<Schema, Name>) {
    this.options = options;
    this.form = options.form;

    this.store = new Derived<FieldStore<Value>>({
      deps: [this.form.store],
      fn: () => {
        const value = this.form.field.get(this.options.name as never) as Value;
        const defaultValue = get(this.form.options.defaultValues as never, stringToPath(this.options.name)) as Value;
        const meta = this.form.field.meta(this.options.name as never);
        const errors = this.form.field.errors(this.options.name as never);

        return {
          value,
          defaultValue,
          meta,
          errors,
        };
      },
    });
  }

  public '~mount' = () => {
    const unsubscribe = this.store.mount();

    return unsubscribe;
  };

  public '~update' = (options: FieldOptions<Schema, Name>) => {
    // ref: https://github.com/TanStack/form/blob/main/packages/form-core/src/FieldApi.ts#L1300
    this.options = options;
  };

  public get value() {
    return this.store.state.value;
  }

  public get defaultValue() {
    return this.store.state.defaultValue;
  }

  public get meta() {
    return this.store.state.meta;
  }

  public get errors() {
    return this.store.state.errors;
  }

  public focus = () => this.form.field.focus(this.options.name);

  public blur = () => this.form.field.blur(this.options.name);

  /**
   * Changes the value of this field with optional control over side effects.
   * @param value - The new value to set for the field
   * @param options - Optional configuration for controlling validation, dirty state, and touched state
   */
  public change = (value: Value, options?: FieldChangeOptions) => {
    return this.form.field.change(this.options.name, value, options);
  };

  public register = () => this.form.field.register(this.options.name);

  /**
   * Validates this specific field using the specified validation type.
   * @param options - Optional validation options specifying the validation type ('change' | 'submit' | 'blur' | 'focus')
   * @returns Promise resolving to an array of validation issues for this field
   */
  public validate = (options?: ValidateOptions) => {
    return this.form.validate(this.options.name, options);
  };

  /**
   * Resets this field to its default value and optionally resets metadata and errors.
   * @param options - Reset options for controlling what gets reset and what gets kept
   */
  public reset = (options?: FormResetFieldOptions<Value>) => {
    return this.form.field.reset(this.options.name, options);
  };

  /**
   * Sets validation errors for this specific field.
   * @param errors - Array of validation errors to set
   * @param mode - How to handle existing errors: 'replace' (default), 'append', or 'keep'
   */
  public setErrors = (errors: FormIssue[], options?: FormSetErrorsOptions) => {
    return this.form.field.setErrors(this.options.name, errors, options);
  };
}
