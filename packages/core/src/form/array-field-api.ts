import { createField } from '#form/create-field';
import type { FieldApi } from '#form/field-api';
import type { FieldChangeOptions } from '#types/api/field-change-options';
import type { AnyFormApi } from '#types/form/any-form-api';
import type { ArrayLike } from '#types/misc/array-like';
import { generateId } from '#utils/generate-id';
import type { Updater } from '#utils/update/updater-';

type ArrayFieldItem<Value extends ArrayLike> = NonNullable<Value>[number];

type ArrayFieldApiOptions = {
  form: AnyFormApi;
  name: string;
};

export class ArrayFieldApi<Value extends ArrayLike, Level extends string = string> {
  private field!: FieldApi<Value, Level>;

  constructor(options: ArrayFieldApiOptions) {
    this.field = createField(options);
  }

  private get form() {
    return this.field.options.form;
  }

  private get name() {
    return this.field.options.name;
  }

  public get options() {
    return this.field.options;
  }

  public get store() {
    return this.field.store;
  }

  public get state() {
    return this.field.state;
  }

  public get ids() {
    return this.state.value?.map(() => generateId()) ?? [];
  }

  public '~mount' = () => {
    return this.field['~mount']();
  };

  public '~update' = (options: ArrayFieldApiOptions) => {
    return this.field['~update'](options);
  };

  public insert = (index: number, value: Updater<ArrayFieldItem<Value>>, options?: FieldChangeOptions) => {
    this.form.array.insert(this.name as never, index, value, options);
  };

  public append = (value: Updater<ArrayFieldItem<Value>>, options?: FieldChangeOptions) => {
    this.form.array.append(this.name as never, value, options);
  };

  public prepend = (value: Updater<ArrayFieldItem<Value>>, options?: FieldChangeOptions) => {
    this.form.array.prepend(this.name as never, value, options);
  };

  public swap = (from: number, to: number, options?: FieldChangeOptions) => {
    this.form.array.swap(this.name as never, from, to, options);
  };

  public move = (from: number, to: number, options?: FieldChangeOptions) => {
    this.form.array.move(this.name as never, from, to, options);
  };

  public update = (index: number, value: Updater<ArrayFieldItem<Value>>, options?: FieldChangeOptions) => {
    this.form.array.update(this.name as never, index, value, options);
  };

  public remove = (index: number, options?: FieldChangeOptions) => {
    this.form.array.remove(this.name as never, index, options);
  };

  public replace = (value: Updater<Value>, options?: FieldChangeOptions) => {
    this.form.array.replace(this.name as never, value as never, options);
  };

  public get = () => {
    return this.form.field.get(this.name as never) as Value;
  };
}
