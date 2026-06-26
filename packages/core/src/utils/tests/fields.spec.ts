import { fields_build, fields_delete, fields_move, fields_remove, fields_reset, fields_root, fields_set, fields_shift } from '#utils/fields';
import type { FormOptions } from '#types/api/form-options';
import { generateId } from '#utils/generate-id';
import { describe, expect, it, vi } from 'vite-plus/test';

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

    expect(entry.id).toBeDefined();
    expect(entry.status.blurred).toBe(false);
    expect(entry.status.dirty).toBe(false);
    expect(entry.status.touched).toBe(false);
    expect(entry.errors).toStrictEqual([]);
    expect(entry.ref).toBeNull();
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

    expect(updated[fields_root].status).toEqual({
      dirty: false,
      touched: true,
      blurred: false,
    });
    expect(updated[`${fields_root}.name`].status).toEqual({
      dirty: true,
      touched: true,
      blurred: false,
    });
    expect(updated[`${fields_root}.nested.value`].status).toEqual({
      dirty: false,
      touched: true,
      blurred: true,
    });
    expect(fields[`${fields_root}.object`].status).toEqual({
      dirty: false,
      touched: false,
      blurred: false,
    });
  });
});

describe('fields_set', () => {
  it('should update the specific path', () => {
    const { fields } = setup();

    const updated = fields_set(fields, 'object', { status: { blurred: true, touched: true } });

    expect(updated[`${fields_root}.object`].status.dirty).toBe(false);
    expect(updated[`${fields_root}.object`].status.touched).toBe(true);
    expect(updated[`${fields_root}.object`].status.blurred).toBe(true);
  });

  it('should update the all ascendent paths', () => {
    const { fields } = setup();

    const updated = fields_set(fields, 'complex.0.array.string', { status: { blurred: true, touched: true } });

    expect(updated[`${fields_root}.complex.0.array.string`].status.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array.string`].status.touched).toBe(true);
    expect(updated[`${fields_root}.complex.0.array.string`].status.blurred).toBe(true);

    expect(updated[`${fields_root}.complex.0.array`].status.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].status.touched).toBe(true);
    expect(updated[`${fields_root}.complex.0.array`].status.blurred).toBe(true);

    expect(updated[`${fields_root}.complex.0.array`].status.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].status.touched).toBe(true);
    expect(updated[`${fields_root}.complex.0.array`].status.blurred).toBe(true);

    expect(updated[`${fields_root}.complex`].status.dirty).toBe(false);
    expect(updated[`${fields_root}.complex`].status.touched).toBe(true);
    expect(updated[`${fields_root}.complex`].status.blurred).toBe(true);
  });

  it('should update the descendant paths', () => {
    const { fields } = setup();

    const updated = fields_set(fields, 'complex', { status: { blurred: true, touched: true } });

    expect(updated[`${fields_root}.complex.0.array.string`].status.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array.string`].status.touched).toBe(false);
    expect(updated[`${fields_root}.complex.0.array.string`].status.blurred).toBe(false);

    expect(updated[`${fields_root}.complex.0.array`].status.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].status.touched).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].status.blurred).toBe(false);

    expect(updated[`${fields_root}.complex.0.array`].status.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].status.touched).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].status.blurred).toBe(false);

    expect(updated[`${fields_root}.complex`].status.dirty).toBe(false);
    expect(updated[`${fields_root}.complex`].status.touched).toBe(true);
    expect(updated[`${fields_root}.complex`].status.blurred).toBe(true);
  });

  it('should not propagate errors to ascendant paths', () => {
    const { fields } = setup();
    const expected = fields[`${fields_root}.complex.0.array`].errors;

    const updated = fields_set(fields, 'complex.0.array.string', {
      errors: [{ path: ['complex', 0, 'array', 'string'] }] as never,
    });
    const errors = updated[`${fields_root}.complex.0.array`].errors;

    expect(errors).toStrictEqual(expected);
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

    expect(updated[`${fields_root}.complex`]).not.toBeDefined();
    expect(updated[`${fields_root}.complex.0`]).not.toBeDefined();
    expect(updated[`${fields_root}.complex.0.array`]).not.toBeDefined();
    expect(updated[`${fields_root}.complex.0.array.string`]).not.toBeDefined();
  });

  it('should not delete ascendant paths', () => {
    const { fields } = setup();

    const updated = fields_delete(fields, 'complex.0.array');

    expect(updated[`${fields_root}.complex`]).toBeDefined();
    expect(updated[`${fields_root}.complex.0`]).toBeDefined();
    expect(updated[`${fields_root}.complex.0.array`]).not.toBeDefined();
    expect(updated[`${fields_root}.complex.0.array.string`]).not.toBeDefined();
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

    expect(updated[`${fields_root}.complex`].status.blurred).toBe(false);
    expect(updated[`${fields_root}.complex.0`].status.blurred).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].status.blurred).toBe(false);
    expect(updated[`${fields_root}.complex.0.array.string`].status.blurred).toBe(false);
  });

  it('should reset status shape', () => {
    const { fields, values } = setup();

    const updated = fields_reset(fields, 'object', { defaultValues: values } as unknown as FormOptions<any>, {
      ...values,
      object: { new: { nested: ['string'] } },
    });

    expect(updated[`${fields_root}.object`]).toBeDefined();
    expect(updated[`${fields_root}.object.new`]).toBeDefined();
    expect(updated[`${fields_root}.object.new.nested`]).toBeDefined();
    expect(updated[`${fields_root}.object.new.nested.0`]).toBeDefined();

    expect(updated[`${fields_root}.object.string`]).not.toBeDefined();
    expect(updated[`${fields_root}.object.number`]).not.toBeDefined();
    expect(updated[`${fields_root}.object.boolean`]).not.toBeDefined();
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

    expect(updated[`${fields_root}.array.0`]).toStrictEqual(fields[`${fields_root}.array.0`]);
    expect(updated[`${fields_root}.array.1`]).toStrictEqual(fields[`${fields_root}.array.2`]);
    expect(updated[`${fields_root}.array.2`]).not.toBeDefined();
  });

  it('should correctly shift multiple status to left', () => {
    const { fields } = setup({ values: { array: [1, 2, 3, 4, 5, 6, 7] } });

    const updated = fields_shift(fields, 'array', 4, 'left');

    expect(updated[`${fields_root}.array.0`]).toStrictEqual(fields[`${fields_root}.array.0`]);
    expect(updated[`${fields_root}.array.1`]).toStrictEqual(fields[`${fields_root}.array.1`]);
    expect(updated[`${fields_root}.array.2`]).toStrictEqual(fields[`${fields_root}.array.2`]);
    expect(updated[`${fields_root}.array.3`]).toStrictEqual(fields[`${fields_root}.array.4`]);
    expect(updated[`${fields_root}.array.4`]).toStrictEqual(fields[`${fields_root}.array.5`]);
    expect(updated[`${fields_root}.array.5`]).toStrictEqual(fields[`${fields_root}.array.6`]);
    expect(updated[`${fields_root}.array.6`]).toStrictEqual(fields[`${fields_root}.array.7`]);
    expect(updated[`${fields_root}.array.7`]).not.toBeDefined();
  });

  it('should correctly shift status to right', () => {
    const { fields } = setup();

    const updated = fields_shift(fields, 'array', 1, 'right');

    expect(updated[`${fields_root}.array.0`]).toStrictEqual(fields[`${fields_root}.array.0`]);
    expect(updated[`${fields_root}.array.1`]).not.toBeDefined();
    expect(updated[`${fields_root}.array.2`]).toStrictEqual(fields[`${fields_root}.array.1`]);
    expect(updated[`${fields_root}.array.3`]).toStrictEqual(fields[`${fields_root}.array.2`]);
  });

  it('should correctly shift multiple status to right', () => {
    const { fields } = setup({ values: { array: [1, 2, 3, 4, 5, 6, 7] } });

    const updated = fields_shift(fields, 'array', 4, 'right');

    expect(updated[`${fields_root}.array.0`]).toStrictEqual(fields[`${fields_root}.array.0`]);
    expect(updated[`${fields_root}.array.1`]).toStrictEqual(fields[`${fields_root}.array.1`]);
    expect(updated[`${fields_root}.array.2`]).toStrictEqual(fields[`${fields_root}.array.2`]);
    expect(updated[`${fields_root}.array.3`]).toStrictEqual(fields[`${fields_root}.array.3`]);
    expect(updated[`${fields_root}.array.4`]).not.toBeDefined();
    expect(updated[`${fields_root}.array.5`]).toStrictEqual(fields[`${fields_root}.array.4`]);
    expect(updated[`${fields_root}.array.6`]).toStrictEqual(fields[`${fields_root}.array.5`]);
    expect(updated[`${fields_root}.array.7`]).toStrictEqual(fields[`${fields_root}.array.6`]);

    expect(updated[`${fields_root}.array.8`]).not.toBeDefined();
  });
});

describe('fields_move', () => {
  it('should move entry forward', () => {
    const { fields } = setup();

    const updated = fields_move(fields, 'array', 0, 2);

    expect(updated[`${fields_root}.array.0`]).toStrictEqual(fields[`${fields_root}.array.1`]);
    expect(updated[`${fields_root}.array.1`]).toStrictEqual(fields[`${fields_root}.array.2`]);
    expect(updated[`${fields_root}.array.2`]).toStrictEqual(fields[`${fields_root}.array.0`]);
  });

  it('should move entry backward', () => {
    const { fields } = setup();

    const updated = fields_move(fields, 'array', 2, 0);

    expect(updated[`${fields_root}.array.0`]).toStrictEqual(fields[`${fields_root}.array.2`]);
    expect(updated[`${fields_root}.array.1`]).toStrictEqual(fields[`${fields_root}.array.0`]);
    expect(updated[`${fields_root}.array.2`]).toStrictEqual(fields[`${fields_root}.array.1`]);
  });

  it('should keep entries unchanged when moving to same index', () => {
    const { fields } = setup();

    const updated = fields_move(fields, 'array', 1, 1);

    expect(updated).toStrictEqual(fields);
  });
});

describe('fields_remove', () => {
  it('should shift following entries left', () => {
    const { fields } = setup();

    const updated = fields_remove(fields, 'array', 0);

    expect(updated[`${fields_root}.array.0`]).toStrictEqual(fields[`${fields_root}.array.1`]);
    expect(updated[`${fields_root}.array.1`]).toStrictEqual(fields[`${fields_root}.array.2`]);
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
