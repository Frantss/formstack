import { FieldApi, type FieldOptions } from '#field-api';
import { FormApi } from '#form-api';
import type {
  FieldChangeOptions,
  FormIssue,
  FormResetFieldOptions,
  FormSetErrorsOptions,
  ValidateOptions,
} from '#form-api.types';
import type { DeepKeysOfType, DeepValue, UnwrapOneLevelOfArray } from '#more-types';
import type { StandardSchema } from '#types';
import type { Updater } from '#utils/update';

export class ArrayFieldApi<
  Schema extends StandardSchema,
  Name extends DeepKeysOfType<StandardSchema.InferInput<Schema>, any[] | null | undefined>,
  in out Value extends DeepValue<StandardSchema.InferInput<Schema>, Name>,
> {
  private form: FormApi<Schema>;
  private field: FieldApi<Schema, Name, Value>;

  constructor(options: FieldOptions<Schema, Name>) {
    this.form = options.form;
    this.field = new FieldApi<Schema, Name, Value>(options);
  }

  public '~mount' = () => {
    const unsubscribe = this.field.store.mount();

    return unsubscribe;
  };

  public '~update' = (options: FieldOptions<Schema, Name>) => {
    this.field.options = options;
  };

  public get value() {
    return this.field.store.state.value;
  }

  public get defaultValue() {
    return this.field.store.state.defaultValue;
  }

  public get meta() {
    return this.field.store.state.meta;
  }

  public get errors() {
    return this.field.store.state.errors;
  }

  public get length() {
    return ((this.field.store.state.value as any[]) ?? []).length;
  }

  /**
   * Appends a new item to the end of the array.
   * @param value - The value to append to the array
   * @param options - Optional configuration for controlling validation, dirty state, and touched state
   */
  public append = (value: UnwrapOneLevelOfArray<Value>, options?: FieldChangeOptions) => {
    return this.form.array.append(this.field.options.name as never, value as never, options);
  };

  /**
   * Prepends a new item to the beginning of the array.
   * @param value - The value to prepend to the array
   * @param options - Optional configuration for controlling validation, dirty state, and touched state
   */
  public prepend = (value: UnwrapOneLevelOfArray<Value>, options?: FieldChangeOptions) => {
    return this.form.array.prepend(this.field.options.name as never, value as never, options);
  };

  /**
   * Inserts a new item at the specified index in the array.
   * @param index - The index at which to insert the value
   * @param value - The value to insert into the array
   * @param options - Optional configuration for controlling validation, dirty state, and touched state
   */
  public insert = (index: number, value: Updater<UnwrapOneLevelOfArray<Value>>, options?: FieldChangeOptions) => {
    return this.form.array.insert(this.field.options.name as never, index, value as never, options);
  };

  /**
   * Updates an item at the specified index in the array.
   * @param index - The index of the item to update
   * @param value - The new value or updater function
   * @param options - Optional configuration for controlling validation, dirty state, and touched state
   */
  public update = (index: number, value: Updater<UnwrapOneLevelOfArray<Value>>, options?: FieldChangeOptions) => {
    return this.form.array.update(this.field.options.name as never, index, value as never, options);
  };

  /**
   * Removes an item at the specified index from the array.
   * @param index - The index of the item to remove
   * @param options - Optional configuration for controlling validation, dirty state, and touched state
   */
  public remove = (index: number, options?: FieldChangeOptions) => {
    return this.form.array.remove(this.field.options.name as never, index, options);
  };

  /**
   * Swaps two items in the array by their indices.
   * @param from - The index of the first item
   * @param to - The index of the second item
   * @param options - Optional configuration for controlling validation, dirty state, and touched state
   */
  public swap = (from: number, to: number, options?: FieldChangeOptions) => {
    return this.form.array.swap(this.field.options.name as never, from, to, options);
  };

  /**
   * Moves an item from one index to another in the array.
   * @param from - The index of the item to move
   * @param to - The target index
   * @param options - Optional configuration for controlling validation, dirty state, and touched state
   */
  public move = (from: number, to: number, options?: FieldChangeOptions) => {
    return this.form.array.move(this.field.options.name as never, from, to, options);
  };

  /**
   * Replaces the entire array with a new value.
   * @param value - The new array value or updater function
   * @param options - Optional configuration for controlling validation, dirty state, and touched state
   */
  public replace = (value: Updater<Value>, options?: FieldChangeOptions) => {
    return this.form.array.replace(this.field.options.name as never, value as never, options);
  };

  /**
   * Validates this specific array field using the specified validation type.
   * @param options - Optional validation options specifying the validation type ('change' | 'submit' | 'blur' | 'focus')
   * @returns Promise resolving to an array of validation issues for this field
   */
  public validate = (options?: ValidateOptions) => {
    return this.form.validate(this.field.options.name, options);
  };

  /**
   * Resets this array field to its default value and optionally resets metadata and errors.
   * @param options - Reset options for controlling what gets reset and what gets kept
   */
  public reset = (options?: FormResetFieldOptions<Value>) => {
    return this.form.field.reset(this.field.options.name, options);
  };

  /**
   * Sets validation errors for this specific array field.
   * @param errors - Array of validation errors to set
   * @param mode - How to handle existing errors: 'replace' (default), 'append', or 'keep'
   */
  public setErrors = (errors: FormIssue[], options?: FormSetErrorsOptions) => {
    return this.form.field.setErrors(this.field.options.name, errors, options);
  };
}
