import type { FormCore } from '#form/form-core';
import {
  fields_build,
  fields_move,
  fields_remove,
  fields_reset,
  fields_set,
  fields_shift,
  fields_swap,
  type FieldSetOptions,
} from '#utils/fields';

export class FormCoreFields<Values, Level extends string = string> {
  private core: FormCore<Values, Level>;

  constructor({ core }: { core: FormCore<Values, Level> }) {
    this.core = core;
  }

  public get = (path: string) => {
    return this.core.persisted.state.fields[path] ?? this.core.persisted.state.fields[`~root.${path}`];
  };

  public set = (path: string, options: FieldSetOptions<Level>) => {
    this.core.persisted.setState(state => {
      return {
        ...state,
        fields: fields_set(state.fields, path, options, this.core.options),
      };
    });
  };

  public reset = (path: string) => {
    this.core.persisted.setState(state => {
      return {
        ...state,
        fields: fields_reset(state.fields, path, this.core.options, state.values),
      };
    });
  };

  public shift = (path: string, position: number, direction: 'left' | 'right') => {
    this.core.persisted.setState(state => {
      return {
        ...state,
        fields: fields_shift(state.fields, path, position, direction),
      };
    });
  };

  public swap = (path: string, from: number, to: number) => {
    this.core.persisted.setState(state => {
      return {
        ...state,
        fields: fields_swap(state.fields, path, from, to),
      };
    });
  };

  public move = (path: string, from: number, to: number) => {
    this.core.persisted.setState(state => {
      return {
        ...state,
        fields: fields_move(state.fields, path, from, to),
      };
    });
  };

  public remove = (path: string, index: number) => {
    this.core.persisted.setState(state => {
      return {
        ...state,
        fields: fields_remove(state.fields, path, index),
      };
    });
  };

  public adjust = () => {
    this.core.persisted.setState(state => {
      const updated = fields_build(this.core.options, state.values);

      return {
        ...state,
        fields: {
          ...updated,
          ...state.fields,
        },
      };
    });
  };
}
