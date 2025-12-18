import type { FieldChangeOptions } from '#/core/form-api.types';
import type { FormContextApi } from '#/core/form-context-api';
import type { FormFieldApi } from '#/core/form-field-api';
import type { DeepKeysOfType, DeepValue, UnwrapOneLevelOfArray } from '#/core/more-types';
import type { StandardSchema } from '#/core/types';

export class FormArrayFieldApi<
  Schema extends StandardSchema<any>,
  Values extends StandardSchema.InferInput<Schema> = StandardSchema.InferInput<Schema>,
  ArrayField extends DeepKeysOfType<Values, any[] | null | undefined> = DeepKeysOfType<
    Values,
    any[] | null | undefined
  >,
> {
  private context: FormContextApi<Schema>;
  private field: FormFieldApi<Schema>;

  constructor({ field, context }: { field: FormFieldApi<Schema>; context: FormContextApi<Schema> }) {
    this.context = context;
    this.field = field;
  }

  public append = <Name extends ArrayField>(
    name: Name,
    value: UnwrapOneLevelOfArray<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    const current = this.field.get(name) as any[];
    const array = current ?? [];

    return this.field.change(name, [...array, value] as never, options);
  };

  public prepend = <Name extends ArrayField>(
    name: Name,
    value: UnwrapOneLevelOfArray<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    const current = this.field.get(name) as any[];
    const array = current ?? [];

    return this.field.change(name, [value, ...array] as never, options);
  };

  public insert = <Name extends ArrayField>(
    name: Name,
    index: number,
    value: UnwrapOneLevelOfArray<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    const current = this.field.get(name) as any[];
    const array = current ?? [];

    if (index < 0) return this.prepend(name, value, options);
    if (index >= array.length) return this.append(name, value, options);

    const updated = [...array.slice(0, index), value, ...array.slice(index)];

    this.field.change(name, updated as never, options);
    this.context.recomputeFieldMeta(name);
  };
}
