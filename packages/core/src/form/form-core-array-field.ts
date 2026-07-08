import type { FormCore } from '#form/form-core';
import type { FormCoreField } from '#form/form-core-field';
import type { FormCoreFields } from '#form/form-core-fields';
import type { FieldChangeOptions } from '#types/api/field-change-options';
import type { ArrayDeepKeys, DeepValue, UnwrapOneLevelOfArray } from '#types/deep';
import { update } from '#utils/update';
import type { Updater } from '#utils/update/updater-';
import { batch } from '@tanstack/store';

export class FormCoreArray<Values, Level extends string = string> {
  private fields: FormCoreFields<Values, Level>;
  private field: FormCoreField<Values, Level>;

  constructor({
    fields,
    field,
  }: {
    core: FormCore<Values, Level>;
    fields: FormCoreFields<Values, Level>;
    field: FormCoreField<Values, Level>;
  }) {
    this.field = field;
    this.fields = fields;
  }

  public insert = <const Name extends ArrayDeepKeys<Values>>(
    name: Name,
    index: number,
    value: Updater<UnwrapOneLevelOfArray<DeepValue<Values, Name>>>,
    options?: FieldChangeOptions,
  ) => {
    if (index < 0) index = 0;
    const previous = this.field.get(name) as any[] | undefined;
    const previousLength = previous?.length ?? 0;

    batch(() => {
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

      if (index < previousLength) this.fields.shift(name, index, 'right');
      this.fields.adjust();
    });
  };

  public append = <const Name extends ArrayDeepKeys<Values>>(
    name: Name,
    value: Updater<UnwrapOneLevelOfArray<DeepValue<Values, Name>>>,
    options?: FieldChangeOptions,
  ) => {
    batch(() => {
      this.field.change(
        name,
        current => {
          const array = (current as any[]) ?? [];
          return [...array, update(value, current as never)] as never;
        },
        options,
      );

      this.fields.adjust();
    });
  };

  public prepend = <const Name extends ArrayDeepKeys<Values>>(
    name: Name,
    value: Updater<UnwrapOneLevelOfArray<DeepValue<Values, Name>>>,
    options?: FieldChangeOptions,
  ) => {
    return this.insert(name, 0, value, options);
  };

  public swap = <const Name extends ArrayDeepKeys<Values>>(
    name: Name,
    from: number,
    to: number,
    options?: FieldChangeOptions,
  ) => {
    const start = from >= 0 ? from : 0;
    const end = to >= 0 ? to : 0;

    if (start === end) return; // no-op

    batch(() => {
      this.field.change(
        name,
        current => {
          const array = (current as any[]) ?? [];
          const updated = [...array];

          [updated[start], updated[end]] = [updated[end], updated[start]];

          return updated as never;
        },
        options,
      );

      this.fields.swap(name, start, end);
      this.fields.adjust();
    });
  };

  public move<const Name extends ArrayDeepKeys<Values>>(
    name: Name,
    _from: number,
    _to: number,
    options?: FieldChangeOptions,
  ) {
    const from = Math.max(_from, 0);
    const to = Math.max(_to, 0);

    batch(() => {
      this.field.change(
        name,
        current => {
          const array: any[] = current ? [...(current as any[])] : [];
          const backwards = from > to;

          if (from === to) return array as never;

          const moved = array[from];
          return array.toSpliced(backwards ? to : to + 1, 0, moved).toSpliced(backwards ? from + 1 : from, 1) as never;
        },
        options,
      );

      this.fields.move(name, from, to);
      this.fields.adjust();
    });
  }

  public update = <const Name extends ArrayDeepKeys<Values>>(
    name: Name,
    index: number,
    value: Updater<UnwrapOneLevelOfArray<DeepValue<Values, Name>>>,
    options?: FieldChangeOptions,
  ) => {
    let position = index;

    this.field.change(
      name,
      current => {
        const array = (current as any[]) ?? [];
        position = Math.max(Math.min(index, array.length - 1), 0);

        return [
          ...array.slice(0, position),
          update(value, array[position] as never),
          ...array.slice(position + 1),
        ] as never;
      },
      options,
    );

    batch(() => {
      this.fields.reset(`${name}.${position}`);
      this.fields.set(`${name}.${position}`, {
        status: {
          dirty: options?.should?.dirty !== false,
          touched: options?.should?.touch !== false,
        },
      });
    });
  };

  public remove<const Name extends ArrayDeepKeys<Values>>(name: Name, index: number, options?: FieldChangeOptions) {
    let position = index;

    batch(() => {
      this.field.change(
        name,
        current => {
          const array = (current as any[]) ?? [];
          position = Math.max(Math.min(index, array.length - 1), 0);

          return [...array.slice(0, position), ...array.slice(position + 1)] as never;
        },
        { ...options, should: { ...options?.should, validate: false } },
      );

      this.fields.remove(name, position);
    });
  }

  public replace<const Name extends ArrayDeepKeys<Values>>(
    name: Name,
    value: Updater<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) {
    const shouldDirty = options?.should?.dirty !== false;
    const shouldTouch = options?.should?.touch !== false;

    batch(() => {
      this.field.change(name, value as never, options);
      this.fields.reset(name);
      this.fields.set(name, {
        status: {
          dirty: shouldDirty ? true : undefined,
          touched: shouldTouch ? true : undefined,
        },
      });
    });
  }
}
