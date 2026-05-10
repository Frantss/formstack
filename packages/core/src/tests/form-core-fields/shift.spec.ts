import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-fields/setup';

it('shifts entries to the left from a position', () => {
  const context = setup();
  const expected0 = context.fields.get('array.0');
  const expected1 = context.fields.get('array.2');

  context.fields.shift('array', 2, 'left');

  const entry0 = context.fields.get('array.0');
  const entry1 = context.fields.get('array.1');

  expect(entry0).toEqual(expected0);
  expect(entry1).toEqual(expected1);
});

it('shifts multiple entries to the left from a position', () => {
  const context = setup();
  const expected0 = context.fields.get('array.0');
  const expected1 = context.fields.get('array.1');
  const expected2 = context.fields.get('array.2');
  const expected3 = context.fields.get('array.4');
  const expected4 = context.fields.get('array.5');
  const expected5 = context.fields.get('array.6');

  context.fields.shift('array', 4, 'left');

  const entry0 = context.fields.get('array.0');
  const entry1 = context.fields.get('array.1');
  const entry2 = context.fields.get('array.2');
  const entry3 = context.fields.get('array.3');
  const entry4 = context.fields.get('array.4');
  const entry5 = context.fields.get('array.5');

  expect(entry0).toEqual(expected0);
  expect(entry1).toEqual(expected1);
  expect(entry2).toEqual(expected2);
  expect(entry3).toEqual(expected3);
  expect(entry4).toEqual(expected4);
  expect(entry5).toEqual(expected5);
});

it('shifts entries to the right from a position', () => {
  const context = setup();
  const expected0 = context.fields.get('array.0');
  const expected2 = context.fields.get('array.1');
  const expected3 = context.fields.get('array.2');

  context.fields.shift('array', 1, 'right');

  const entry0 = context.fields.get('array.0');
  const entry2 = context.fields.get('array.2');
  const entry3 = context.fields.get('array.3');

  expect(entry0).toEqual(expected0);
  expect(entry2).toEqual(expected2);
  expect(entry3).toEqual(expected3);
});

it('shifts multiple entries to the right from a position', () => {
  const context = setup();
  const expected0 = context.fields.get('array.0');
  const expected1 = context.fields.get('array.1');
  const expected2 = context.fields.get('array.2');
  const expected3 = context.fields.get('array.3');
  const expected5 = context.fields.get('array.4');
  const expected6 = context.fields.get('array.5');
  const expected7 = context.fields.get('array.6');

  context.fields.shift('array', 4, 'right');

  const entry0 = context.fields.get('array.0');
  const entry1 = context.fields.get('array.1');
  const entry2 = context.fields.get('array.2');
  const entry3 = context.fields.get('array.3');
  const entry5 = context.fields.get('array.5');
  const entry6 = context.fields.get('array.6');
  const entry7 = context.fields.get('array.7');

  expect(entry0).toEqual(expected0);
  expect(entry1).toEqual(expected1);
  expect(entry2).toEqual(expected2);
  expect(entry3).toEqual(expected3);
  expect(entry5).toEqual(expected5);
  expect(entry6).toEqual(expected6);
  expect(entry7).toEqual(expected7);
});

it('removes the source entry when shifting left', () => {
  const context = setup();

  context.fields.shift('array', 6, 'left');
  const entry = context.fields.get('array.6');

  expect(entry).toBeUndefined();
});

it('removes the source entry when shifting right', () => {
  const context = setup();

  context.fields.shift('array', 4, 'right');
  const entry = context.fields.get('array.4');

  expect(entry).toBeUndefined();
});
