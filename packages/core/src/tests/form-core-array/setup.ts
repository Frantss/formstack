import { FormCoreArray } from '#form/form-core-array-field';
import { FormCore } from '#form/form-core';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import z from 'zod';

const schema = z.object({
  array: z.string().array(),
  sibling: z.string(),
});

const defaultValues = {
  array: ['item1', 'item2'],
  sibling: 'sibling',
};

type Values = z.infer<typeof schema>;

export const setup = () => {
  const core = new FormCore<Values>({
    schema,
    defaultValues,
  });

  const fields = new FormCoreFields<Values>({ core });
  const field = new FormCoreField<Values>({ core, fields });
  const array = new FormCoreArray<Values>({ core, fields, field });

  return {
    core,
    fields,
    field,
    array,
  };
};
