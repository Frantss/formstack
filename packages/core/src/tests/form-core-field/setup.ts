import { FormCore } from '#form/form-core';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import type { FormOptions } from '#types/api/form-options';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  count: z.number(),
  nested: z.object({
    value: z.string(),
  }),
});

const defaultValues = {
  name: 'name',
  count: 1,
  nested: {
    value: 'value',
  },
};

type Values = z.infer<typeof schema>;

export const setup = (options?: {
  checks?: FormOptions<Values>['checks'];
  defaultStatus?: FormOptions<Values>['defaultStatus'];
  defaultFieldStatus?: FormOptions<Values>['defaultFieldStatus'];
}) => {
  const core = new FormCore<Values>({
    schema,
    defaultValues,
    checks: options?.checks,
    defaultStatus: options?.defaultStatus,
    defaultFieldStatus: options?.defaultFieldStatus,
  });

  const fields = new FormCoreFields<Values>({ core });
  const field = new FormCoreField<Values>({ core, fields });

  return {
    core,
    fields,
    field,
  };
};
