import { defaultMeta } from '#field-api.constants';
import type { FieldChangeOptions } from '#form-api.types';
import type { FormContextApi } from '#form-context-api';
import type { FormFieldApi } from '#form-field-api';
import type { DeepKeysOfType, DeepValue, UnwrapOneLevelOfArray } from '#more-types';
import type { StandardSchema } from '#types';
import { get } from '#utils/get';
import { update, type Updater } from '#utils/update';
import { stringToPath } from 'remeda';

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

  public insert = <Name extends ArrayField>(
    name: Name,
    index: number,
    value: Updater<UnwrapOneLevelOfArray<DeepValue<Values, Name>>>,
    options?: FieldChangeOptions,
  ) => {
    if (index < 0) index = 0;

    this.field.change(
      name,
      current => {
        const array = (current as any[]) ?? [];

        return [
          ...array.slice(0, index),
          ...(Array.from({ length: index - array.length }, () => undefined) as any[]),
          update(value, current as never),
          ...array.slice(index),
        ] as never;
      },
      options,
    );

    this.context.persisted.setState(current => {
      const fields = { ...current.fields };
      const value = get(current.values as never, stringToPath(name)) as any[] | undefined;
      const length = value?.length;

      if (length === undefined) return current;

      for (let i = index; i < length; i++) {
        const moving = current.fields[`${name}.${i}`];
        fields[`${name}.${i + 1}`] = moving ?? defaultMeta;
      }

      fields[`${name}.${index}`] = defaultMeta;

      return {
        ...current,
        fields,
      };
    });
  };

  public append = <Name extends ArrayField>(
    name: Name,
    value: UnwrapOneLevelOfArray<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    const current = this.field.get(name) as any[];
    return this.insert(name, current?.length ?? 0, value, options);
  };

  public prepend = <Name extends ArrayField>(
    name: Name,
    value: UnwrapOneLevelOfArray<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    return this.insert(name, 0, value, options);
  };

  public swap = <Name extends ArrayField>(name: Name, from: number, to: number, options?: FieldChangeOptions) => {
    const start = from >= 0 ? from : 0;
    const end = to >= 0 ? to : 0;

    this.field.change(
      name,
      current => {
        const array = (current as any[]) ?? [];

        if (start === end) return array as never; // no-op

        const a = array[start];
        const b = array[end];

        return [...array.slice(0, start), b, ...array.slice(start + 1, end), a, ...array.slice(end + 1)] as never;
      },
      options,
    );

    this.context.persisted.setState(current => {
      const fields = { ...current.fields };

      fields[`${name}.${start}`] = current.fields[`${name}.${end}`] ?? defaultMeta;
      fields[`${name}.${end}`] = current.fields[`${name}.${start}`] ?? defaultMeta;

      return {
        ...current,
        fields,
      };
    });
  };

  public move<Name extends ArrayField>(name: Name, _from: number, _to: number, options?: FieldChangeOptions) {
    const from = Math.max(_from, 0);
    const to = Math.max(_to, 0);
    const backwards = from > to;

    this.field.change(
      name,
      current => {
        const array: any[] = current ? [...(current as any[])] : [];

        if (from === to) return array as never;

        const moved = array[from];
        return array.toSpliced(backwards ? to : to + 1, 0, moved).toSpliced(backwards ? from + 1 : from, 1) as never;
      },
      options,
    );

    this.context.persisted.setState(current => {
      const fields = { ...current.fields };
      const value = get(current.values as never, stringToPath(name)) as any[] | undefined;
      const length = value?.length;

      const start = Math.min(from, to);
      const end = Math.max(from, to);

      if (length === undefined) return current;

      if (!backwards) {
        fields[`${name}.${to}`] = current.fields[`${name}.${from}`] ?? defaultMeta;
      }

      for (let i = backwards ? start + 1 : start; i < end; i++) {
        const shift = backwards ? -1 : 1;
        const moving = current.fields[`${name}.${i + shift}`];
        fields[`${name}.${i}`] = moving ?? defaultMeta;
      }

      return {
        ...current,
        fields,
      };
    });
  }

  public update = <Name extends ArrayField>(
    name: Name,
    index: number,
    value: Updater<UnwrapOneLevelOfArray<DeepValue<Values, Name>>>,
    options?: FieldChangeOptions,
  ) => {
    this.field.change(
      name,
      current => {
        const array = (current as any[]) ?? [];
        const position = Math.max(Math.min(index, array.length - 1), 0);

        return [...array.slice(0, position), update(value, current as never), ...array.slice(position + 1)] as never;
      },
      options,
    );

    this.context.resetFieldMeta(`${name}.${index}`);
    this.context.setFieldMeta(`${name}.${index}`, {
      dirty: options?.should?.dirty !== false,
      touched: options?.should?.touch !== false,
    });
  };

  public remove<Name extends ArrayField>(name: Name, index: number, options?: FieldChangeOptions) {
    let position = index;

    this.field.change(
      name,
      current => {
        const array = (current as any[]) ?? [];
        position = Math.max(Math.min(index, array.length - 1), 0);

        return [...array.slice(0, position), ...array.slice(position + 1)] as never;
      },
      { ...options, should: { ...options?.should, validate: false } },
    );

    this.context.persisted.setState(current => {
      const fields = { ...current.fields };
      const value = get(current.values as never, stringToPath(name)) as any[] | undefined;
      const length = value?.length ?? 0;

      for (let i = position; i < length; i++) {
        const moving = current.fields[`${name}.${i + 1}`];
        fields[`${name}.${i}`] = moving ?? defaultMeta;
      }

      delete fields[`${name}.${length}`];

      return {
        ...current,
        fields,
      };
    });

    const shouldValidate = options?.should?.validate !== false;
    if (shouldValidate) void this.context.validate(name, { type: 'change' });
  }

  public replace<Name extends ArrayField>(
    name: Name,
    value: Updater<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) {
    this.context.resetFieldMeta(name);
    this.field.change(name, value as never, options);
  }
}
