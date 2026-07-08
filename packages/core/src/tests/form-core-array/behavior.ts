import type { FieldChangeOptions } from '#types/api/field-change-options';
import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-array/setup';

type ArrayContext = ReturnType<typeof setup>;
type ArrayMutation = (context: ArrayContext, options?: FieldChangeOptions) => void;

export const itAppliesArrayFieldStatus = (operation: string, mutate: ArrayMutation) => {
  it(`${operation} marks the array field as dirty by default`, () => {
    const context = setup();

    mutate(context);
    const status = context.field.status('array');

    expect(status.dirty).toBe(true);
  });

  it(`${operation} marks the array field as touched by default`, () => {
    const context = setup();

    mutate(context);
    const status = context.field.status('array');

    expect(status.touched).toBe(true);
  });

  it(`${operation} does not mark the array field as dirty when should.dirty is false`, () => {
    const context = setup();

    mutate(context, { should: { dirty: false } });
    const status = context.field.status('array');

    expect(status.dirty).toBe(false);
  });

  it(`${operation} does not mark the array field as touched when should.touch is false`, () => {
    const context = setup();

    mutate(context, { should: { touch: false } });
    const status = context.field.status('array');

    expect(status.touched).toBe(false);
  });
};

export const itKeepsSiblingValue = (operation: string, mutate: ArrayMutation) => {
  it(`${operation} keeps sibling values unchanged`, () => {
    const context = setup();

    mutate(context);
    const value = context.field.get('sibling');

    expect(value).toBe('sibling');
  });
};
