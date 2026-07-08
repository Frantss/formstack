import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-fields/setup';

it('shifts entries to the left from a position', () => {
  const context = setup();
  const expected0 = context.fields.get('array.0');
  const expected1 = context.fields.get('array.2');

  context.fields.shift('array', 2, 'left');

  expect({
    entry0: context.fields.get('array.0'),
    entry1: context.fields.get('array.1'),
  }).toEqual({
    entry0: expected0,
    entry1: expected1,
  });
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

  expect({
    entry0: context.fields.get('array.0'),
    entry1: context.fields.get('array.1'),
    entry2: context.fields.get('array.2'),
    entry3: context.fields.get('array.3'),
    entry4: context.fields.get('array.4'),
    entry5: context.fields.get('array.5'),
  }).toEqual({
    entry0: expected0,
    entry1: expected1,
    entry2: expected2,
    entry3: expected3,
    entry4: expected4,
    entry5: expected5,
  });
});

it('shifts entries to the right from a position', () => {
  const context = setup();
  const expected0 = context.fields.get('array.0');
  const expected2 = context.fields.get('array.1');
  const expected3 = context.fields.get('array.2');

  context.fields.shift('array', 1, 'right');

  expect({
    entry0: context.fields.get('array.0'),
    entry2: context.fields.get('array.2'),
    entry3: context.fields.get('array.3'),
  }).toEqual({
    entry0: expected0,
    entry2: expected2,
    entry3: expected3,
  });
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

  expect({
    entry0: context.fields.get('array.0'),
    entry1: context.fields.get('array.1'),
    entry2: context.fields.get('array.2'),
    entry3: context.fields.get('array.3'),
    entry5: context.fields.get('array.5'),
    entry6: context.fields.get('array.6'),
    entry7: context.fields.get('array.7'),
  }).toEqual({
    entry0: expected0,
    entry1: expected1,
    entry2: expected2,
    entry3: expected3,
    entry5: expected5,
    entry6: expected6,
    entry7: expected7,
  });
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
