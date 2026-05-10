import type { FieldBlurOptions } from '#types/api/field-blur-options';
import type { FieldChangeOptions } from '#types/api/field-change-options';
import type { FieldFocusOptions } from '#types/api/field-focus-options';
import type { FieldOptions } from '#types/api/field-options';
import type { FieldStore } from '#types/api/field-store';
import type { FormErrorsOptions } from '#types/api/form-errors-options';
import type { FormIssue } from '#types/api/form-issue';
import type { FormResetFieldOptions } from '#types/api/form-reset-field-options';
import type { FormSetErrorsOptions } from '#types/api/form-set-errors-options';
import type { FormStore } from '#types/api/form-store';
import { fields_pathWithRoot } from '#utils/fields';
import { get } from '#utils/get';
import { createStore, type ReadonlyStore } from '@tanstack/store';
import { stringToPath } from 'remeda';

export class FieldApi<Value> {
  public options: FieldOptions<any, any>;
  public store: ReadonlyStore<FieldStore<Value>>;

  constructor(options: FieldOptions<any, any>) {
    this.options = options;
    this.store = createStore<FieldStore<Value>>(() => {
      const form = this.options.form.store.state as FormStore<any>;
      const state = form.fields[fields_pathWithRoot(this.options.name) as never];
      const path = stringToPath(this.options.name as never);
      const value = get(form.values as never, path as never) as Value;
      const defaultValue = get(this.options.form.options.defaultValues as never, path as never) as Value;

      return {
        ...state,
        value,
        defaultValue,
      };
    });
  }

  public get id() {
    return this.store.state.id;
  }

  public get state() {
    return this.store.state;
  }

  public get value() {
    return this.get();
  }

  public '~mount' = () => {
    return () => {};
  };

  public '~update' = (options: FieldOptions<any, any>) => {
    this.options = options;
  };

  public change = (updater: Value | ((current: Value) => Value), options?: FieldChangeOptions) => {
    this.options.form.field.change(this.options.name as never, updater as never, options);
  };

  public focus = (options?: FieldFocusOptions) => {
    this.options.form.field.focus(this.options.name as never, options);
  };

  public blur = (options?: FieldBlurOptions) => {
    this.options.form.field.blur(this.options.name as never, options);
  };

  public get = () => {
    return this.options.form.field.get(this.options.name as never) as Value;
  };

  public register = (element: HTMLElement | null) => {
    return this.options.form.field.register(this.options.name as never)(element);
  };

  public unregister = () => {
    this.options.form.field.unregister(this.options.name as never);
  };

  public errors = (options?: FormErrorsOptions): FormIssue[] => {
    return this.options.form.field.errors(this.options.name as never, options);
  };

  public setErrors = (errors: FormIssue[], options?: FormSetErrorsOptions) => {
    this.options.form.field.setErrors(this.options.name as never, errors, options);
  };

  public reset = (options?: FormResetFieldOptions<Value>) => {
    this.options.form.field.reset(this.options.name as never, options as never);
  };
}
