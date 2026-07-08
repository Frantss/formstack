import {
  fields_build,
  fields_delete,
  fields_move,
  fields_remove,
  fields_reset,
  fields_root,
  fields_set,
  fields_shift,
  fields_swap,
  fields_pathWithRoot,
} from '#utils/fields';
import type { FormOptions } from '#types/api/form-options';
import { generateId } from '#utils/generate-id';
import { describe, expect, it } from 'vite-plus/test';
import { vi } from 'vitest';

vi.mock('#utils/generate-id', { spy: true });

const setup = (overrides?: { values?: unknown; id?: string }) => {
  const values = {
    object: {
      string: 'string',
      number: 12,
      boolean: true,
    },
    array: [1, 2, 3],
    complex: [{ array: { string: 'string' } }],
  };

  if (overrides?.id) vi.mocked(generateId).mockReturnValue(overrides.id);

  const fields = fields_build({
    defaultValues: overrides?.values ?? values,
    defaultFieldStatus: undefined,
  } as unknown as FormOptions<any>);

  return {
    fields,
    values,
  };
};

it('keeps root-prefixed field paths unchanged', () => {
  expect(fields_pathWithRoot(`${fields_root}.name`)).toBe(`${fields_root}.name`);
});

describe('fields_build', () => {
  it('should create an entry for each path', () => {
    const { fields } = setup();

    expect(Object.keys(fields)).toStrictEqual([
      fields_root,
      `${fields_root}.object`,
      `${fields_root}.object.string`,
      `${fields_root}.object.number`,
      `${fields_root}.object.boolean`,
      `${fields_root}.array`,
      `${fields_root}.array.0`,
      `${fields_root}.array.1`,
      `${fields_root}.array.2`,
      `${fields_root}.complex`,
      `${fields_root}.complex.0`,
      `${fields_root}.complex.0.array`,
      `${fields_root}.complex.0.array.string`,
    ]);
  });

  it('should create the correct fields map', () => {
    const { fields } = setup();
    const entry = fields[`${fields_root}.object`];

    expect({
      issues: entry.issues,
      hasId: Boolean(entry.id),
      ref: entry.ref,
      status: entry.status,
    }).toStrictEqual({
      issues: { error: [] },
      hasId: true,
      ref: null,
      status: {
        blurred: false,
        dirty: false,
        touched: false,
      },
    });
  });

  it('should apply wildcard and field-specific status defaults', () => {
    const { fields } = setup();

    const updated = fields_build({
      defaultValues: {
        name: 'name',
        nested: { value: 'value' },
      },
      defaultFieldStatus: {
        '*': { touched: true },
        name: { dirty: true },
        'nested.value': { blurred: true },
      },
    } as unknown as FormOptions<any>);

    expect({
      nestedValue: updated[`${fields_root}.nested.value`].status,
      object: fields[`${fields_root}.object`].status,
      root: updated[fields_root].status,
      name: updated[`${fields_root}.name`].status,
    }).toEqual({
      nestedValue: {
        blurred: true,
        dirty: false,
        touched: true,
      },
      object: {
        blurred: false,
        dirty: false,
        touched: false,
      },
      root: {
        blurred: false,
        dirty: false,
        touched: true,
      },
      name: {
        blurred: false,
        dirty: true,
        touched: true,
      },
    });
  });
});

describe('fields_set', () => {
  it('should update the specific path status', () => {
    const { fields } = setup();

    const updated = fields_set(fields, 'object', { status: { blurred: true, touched: true } });

    expect(updated[`${fields_root}.object`].status).toEqual({
      blurred: true,
      dirty: false,
      touched: true,
    });
  });

  it('should update all ascendant paths', () => {
    const { fields } = setup();

    const updated = fields_set(fields, 'complex.0.array.string', { status: { blurred: true, touched: true } });

    expect({
      complex: updated[`${fields_root}.complex`].status,
      complexArray: updated[`${fields_root}.complex.0.array`].status,
      leaf: updated[`${fields_root}.complex.0.array.string`].status,
    }).toEqual({
      complex: {
        blurred: true,
        dirty: false,
        touched: true,
      },
      complexArray: {
        blurred: true,
        dirty: false,
        touched: true,
      },
      leaf: {
        blurred: true,
        dirty: false,
        touched: true,
      },
    });
  });

  it('should update the descendant paths', () => {
    const { fields } = setup();

    const updated = fields_set(fields, 'complex', { status: { blurred: true, touched: true } });

    expect({
      complex: updated[`${fields_root}.complex`].status,
      complexArray: updated[`${fields_root}.complex.0.array`].status,
      leaf: updated[`${fields_root}.complex.0.array.string`].status,
    }).toEqual({
      complex: {
        blurred: true,
        dirty: false,
        touched: true,
      },
      complexArray: {
        blurred: false,
        dirty: false,
        touched: false,
      },
      leaf: {
        blurred: false,
        dirty: false,
        touched: false,
      },
    });
  });

  it('should not propagate error issues to ascendant paths', () => {
    const { fields } = setup();
    const expected = fields[`${fields_root}.complex.0.array`].issues;

    const updated = fields_set(fields, 'complex.0.array.string', {
      issues: { error: [{ level: 'error', issue: { path: ['complex', 0, 'array', 'string'] } as never }] },
    });
    const issues = updated[`${fields_root}.complex.0.array`].issues;

    expect(issues).toStrictEqual(expected);
  });

  it('should not propagate refs to ascendant paths', () => {
    const { fields } = setup();
    const expected = fields[`${fields_root}.complex.0.array`].ref;
    const ref = {} as HTMLElement;

    const updated = fields_set(fields, 'complex.0.array.string', { ref });
    const ascendantRef = updated[`${fields_root}.complex.0.array`].ref;

    expect(ascendantRef).toStrictEqual(expected);
  });
});

describe('fields_delete', () => {
  it('should specified path', () => {
    const { fields } = setup();

    const updated = fields_delete(fields, 'object');

    expect(updated[`${fields_root}.object`]).not.toBeDefined();
  });

  it('should all descendant paths', () => {
    const { fields } = setup();

    const updated = fields_delete(fields, 'complex');

    expect([
      updated[`${fields_root}.complex`],
      updated[`${fields_root}.complex.0`],
      updated[`${fields_root}.complex.0.array`],
      updated[`${fields_root}.complex.0.array.string`],
    ]).toEqual([undefined, undefined, undefined, undefined]);
  });

  it('should not delete ascendant paths', () => {
    const { fields } = setup();

    const updated = fields_delete(fields, 'complex.0.array');

    expect({
      complex: Boolean(updated[`${fields_root}.complex`]),
      complexIndex: Boolean(updated[`${fields_root}.complex.0`]),
      complexArray: updated[`${fields_root}.complex.0.array`],
      leaf: updated[`${fields_root}.complex.0.array.string`],
    }).toEqual({
      complex: true,
      complexIndex: true,
      complexArray: undefined,
      leaf: undefined,
    });
  });

  it('should delete unrelated paths', () => {
    const { fields } = setup();
    const updated = fields_delete(fields, 'object.boolean');
    const numberOfEntries = Object.keys(updated).length;

    expect(numberOfEntries).toBe(12);
  });
});

describe('fields_reset', () => {
  it('should reset path', () => {
    const { fields, values } = setup();

    const set = fields_set(fields, 'object', { status: { blurred: true } });
    const updated = fields_reset(set, 'object', { defaultValues: values } as unknown as FormOptions<any>);

    expect(updated[`${fields_root}.object`].status.blurred).toBe(false);
  });

  it('should reset descendant paths', () => {
    const { fields, values } = setup();

    const set = fields_set(fields, 'complex', { status: { blurred: true } });
    const updated = fields_reset(set, 'complex', { defaultValues: values } as unknown as FormOptions<any>);

    expect([
      updated[`${fields_root}.complex`].status.blurred,
      updated[`${fields_root}.complex.0`].status.blurred,
      updated[`${fields_root}.complex.0.array`].status.blurred,
      updated[`${fields_root}.complex.0.array.string`].status.blurred,
    ]).toEqual([false, false, false, false]);
  });

  it('should reset status shape', () => {
    const { fields, values } = setup();

    const updated = fields_reset(fields, 'object', { defaultValues: values } as unknown as FormOptions<any>, {
      ...values,
      object: { new: { nested: ['string'] } },
    });

    expect({
      newNested: Boolean(updated[`${fields_root}.object.new.nested`]),
      newNestedItem: Boolean(updated[`${fields_root}.object.new.nested.0`]),
      newObject: Boolean(updated[`${fields_root}.object.new`]),
      number: updated[`${fields_root}.object.number`],
      object: Boolean(updated[`${fields_root}.object`]),
      string: updated[`${fields_root}.object.string`],
      boolean: updated[`${fields_root}.object.boolean`],
    }).toEqual({
      newNested: true,
      newNestedItem: true,
      newObject: true,
      number: undefined,
      object: true,
      string: undefined,
      boolean: undefined,
    });
  });

  it('should reset with wildcard and field-specific status defaults', () => {
    const { fields, values } = setup({ values: { object: { string: 'string' } } });
    const set = fields_set(fields, 'object.string', { status: { touched: false, dirty: false, blurred: true } });

    const updated = fields_reset(set, 'object.string', {
      defaultValues: values,
      defaultFieldStatus: {
        '*': { touched: true },
        'object.string': { dirty: true },
      },
    } as unknown as FormOptions<any>);

    expect(updated[`${fields_root}.object.string`].status).toEqual({
      dirty: true,
      touched: true,
      blurred: false,
    });
  });
});

describe('fields_shift', () => {
  it('should correctly shift status to left', () => {
    const { fields } = setup();

    const updated = fields_shift(fields, 'array', 2, 'left');

    expect({
      entry0: updated[`${fields_root}.array.0`],
      entry1: updated[`${fields_root}.array.1`],
      entry2: updated[`${fields_root}.array.2`],
    }).toStrictEqual({
      entry0: fields[`${fields_root}.array.0`],
      entry1: fields[`${fields_root}.array.2`],
      entry2: undefined,
    });
  });

  it('should correctly shift multiple status to left', () => {
    const { fields } = setup({ values: { array: [1, 2, 3, 4, 5, 6, 7] } });

    const updated = fields_shift(fields, 'array', 4, 'left');

    expect({
      entry0: updated[`${fields_root}.array.0`],
      entry1: updated[`${fields_root}.array.1`],
      entry2: updated[`${fields_root}.array.2`],
      entry3: updated[`${fields_root}.array.3`],
      entry4: updated[`${fields_root}.array.4`],
      entry5: updated[`${fields_root}.array.5`],
      entry6: updated[`${fields_root}.array.6`],
      entry7: updated[`${fields_root}.array.7`],
    }).toStrictEqual({
      entry0: fields[`${fields_root}.array.0`],
      entry1: fields[`${fields_root}.array.1`],
      entry2: fields[`${fields_root}.array.2`],
      entry3: fields[`${fields_root}.array.4`],
      entry4: fields[`${fields_root}.array.5`],
      entry5: fields[`${fields_root}.array.6`],
      entry6: fields[`${fields_root}.array.7`],
      entry7: undefined,
    });
  });

  it('should correctly shift status to right', () => {
    const { fields } = setup();

    const updated = fields_shift(fields, 'array', 1, 'right');

    expect({
      entry0: updated[`${fields_root}.array.0`],
      entry1: updated[`${fields_root}.array.1`],
      entry2: updated[`${fields_root}.array.2`],
      entry3: updated[`${fields_root}.array.3`],
    }).toStrictEqual({
      entry0: fields[`${fields_root}.array.0`],
      entry1: undefined,
      entry2: fields[`${fields_root}.array.1`],
      entry3: fields[`${fields_root}.array.2`],
    });
  });

  it('should correctly shift multiple status to right', () => {
    const { fields } = setup({ values: { array: [1, 2, 3, 4, 5, 6, 7] } });

    const updated = fields_shift(fields, 'array', 4, 'right');

    expect({
      entry0: updated[`${fields_root}.array.0`],
      entry1: updated[`${fields_root}.array.1`],
      entry2: updated[`${fields_root}.array.2`],
      entry3: updated[`${fields_root}.array.3`],
      entry4: updated[`${fields_root}.array.4`],
      entry5: updated[`${fields_root}.array.5`],
      entry6: updated[`${fields_root}.array.6`],
      entry7: updated[`${fields_root}.array.7`],
      entry8: updated[`${fields_root}.array.8`],
    }).toStrictEqual({
      entry0: fields[`${fields_root}.array.0`],
      entry1: fields[`${fields_root}.array.1`],
      entry2: fields[`${fields_root}.array.2`],
      entry3: fields[`${fields_root}.array.3`],
      entry4: undefined,
      entry5: fields[`${fields_root}.array.4`],
      entry6: fields[`${fields_root}.array.5`],
      entry7: fields[`${fields_root}.array.6`],
      entry8: undefined,
    });
  });
});

describe('fields_move', () => {
  it('should move entry forward', () => {
    const { fields } = setup();

    const updated = fields_move(fields, 'array', 0, 2);

    expect({
      entry0: updated[`${fields_root}.array.0`],
      entry1: updated[`${fields_root}.array.1`],
      entry2: updated[`${fields_root}.array.2`],
    }).toStrictEqual({
      entry0: fields[`${fields_root}.array.1`],
      entry1: fields[`${fields_root}.array.2`],
      entry2: fields[`${fields_root}.array.0`],
    });
  });

  it('should move entry backward', () => {
    const { fields } = setup();

    const updated = fields_move(fields, 'array', 2, 0);

    expect({
      entry0: updated[`${fields_root}.array.0`],
      entry1: updated[`${fields_root}.array.1`],
      entry2: updated[`${fields_root}.array.2`],
    }).toStrictEqual({
      entry0: fields[`${fields_root}.array.2`],
      entry1: fields[`${fields_root}.array.0`],
      entry2: fields[`${fields_root}.array.1`],
    });
  });

  it('should keep entries unchanged when moving to same index', () => {
    const { fields } = setup();

    const updated = fields_move(fields, 'array', 1, 1);

    expect(updated).toStrictEqual(fields);
  });

  it('should delete destination when moving a missing entry', () => {
    const { fields } = setup();

    const updated = fields_move(fields, 'array', 99, 1);

    expect(updated[`${fields_root}.array.1`]).not.toBeDefined();
  });
});

describe('fields_swap', () => {
  it('should delete missing swap endpoints', () => {
    const { fields } = setup();

    const updated = fields_swap(fields, 'array', 99, 100);

    expect([updated[`${fields_root}.array.99`], updated[`${fields_root}.array.100`]]).toEqual([undefined, undefined]);
  });
});

describe('fields_remove', () => {
  it('should shift following entries left', () => {
    const { fields } = setup();

    const updated = fields_remove(fields, 'array', 0);

    expect({
      entry0: updated[`${fields_root}.array.0`],
      entry1: updated[`${fields_root}.array.1`],
    }).toStrictEqual({
      entry0: fields[`${fields_root}.array.1`],
      entry1: fields[`${fields_root}.array.2`],
    });
  });

  it('should delete trailing entry after shift', () => {
    const { fields } = setup();

    const updated = fields_remove(fields, 'array', 0);

    expect(updated[`${fields_root}.array.2`]).not.toBeDefined();
  });

  it('should delete target entry when removing last index', () => {
    const { fields } = setup();

    const updated = fields_remove(fields, 'array', 2);

    expect(updated[`${fields_root}.array.2`]).not.toBeDefined();
  });
});
