import { FormCore } from '#form/form-core';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import type { FormIssuesByLevel } from '#types/api/form-issue-entry';
import { expect, expectTypeOf, it } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({
  name: z.string().min(3, 'Name is too short'),
  nested: z.object({
    value: z.string(),
  }),
  items: z
    .object({
      value: z.string(),
    })
    .array(),
});

const defaultValues = {
  name: 'bad',
  nested: {
    value: '',
  },
  items: [{ value: 'a' }, { value: 'b' }],
};

type Values = z.infer<typeof schema>;

const flattenIssues = (issues: FormIssuesByLevel<string>) => Object.values(issues).flat();

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(resolver => {
    resolve = resolver;
  });

  return {
    promise,
    resolve,
  };
};

const setup = () => {
  const core = new FormCore<Values>({
    schema,
    defaultValues,
    checks: {
      warning: {
        blocking: false,
        validate: {
          change: z.object({
            name: z.string().min(5, 'Name warning'),
          }),
        },
      },
      notice: {
        blocking: false,
        validate: {
          change: z.object({
            nested: z.object({
              value: z.string().min(2, 'Nested notice'),
            }),
          }),
        },
      },
      risk: {
        blocking: true,
        validate: {
          submit: z.object({
            name: z.string().min(5, 'Risk name'),
          }),
        },
      },
    },
  });
  const fields = new FormCoreFields<Values>({ core });
  const field = new FormCoreField<Values>({ core, fields });

  return {
    core,
    field,
  };
};

it('collects issues from multiple levels on the same event', async () => {
  const context = setup();

  const [valid, issues] = await context.core.validate(undefined, { type: 'change' });

  expect({
    nestedLevel: context.core.store.state.fields['~root.nested.value'].issues.notice[0]?.level,
    returnedIssues: flattenIssues(issues).length,
    nameLevel: context.core.store.state.fields['~root.name'].issues.warning[0]?.level,
    valid,
  }).toEqual({
    nestedLevel: 'notice',
    returnedIssues: 2,
    nameLevel: 'warning',
    valid: true,
  });
});

it('validates only the targeted subtree and preserves unrelated issues', async () => {
  const context = setup();

  context.field.setIssues('name', {
    warning: [{ level: 'warning', issue: { code: 'custom', message: 'existing', path: ['name'] } as never }],
  });
  const [valid, issues] = await context.core.validate('nested', { type: 'change' });

  expect({
    nestedNotices: context.core.store.state.fields['~root.nested.value'].issues.notice.length,
    returnedIssues: flattenIssues(issues).length,
    preservedMessage: context.core.store.state.fields['~root.name'].issues.warning[0]?.issue.message,
    valid,
  }).toEqual({
    nestedNotices: 1,
    returnedIssues: 1,
    preservedMessage: 'existing',
    valid: true,
  });
});

it('clears stale issues when the validated subtree becomes valid', async () => {
  const context = setup();

  await context.core.validate('name', { type: 'change' });

  context.core.set('name', 'valid name');
  const [valid, issues] = await context.core.validate('name', { type: 'change' });

  expect({
    returnedIssues: issues,
    storedIssues: context.core.store.state.fields['~root.name'].issues,
    valid,
  }).toEqual({
    returnedIssues: { error: [], notice: [], warning: [], risk: [] },
    storedIssues: {
      error: [],
      notice: [],
      warning: [],
      risk: [],
    },
    valid: true,
  });
});

it('marks blocking issues as invalid and computes derived status', async () => {
  const context = setup();

  const [valid, issues] = await context.core.validate(undefined, { type: 'submit' });

  expect({
    fieldValid: context.core.store.state.fields['~root.name'].status.valid,
    formValid: context.core.store.state.status.valid,
    riskLevel: issues.risk[0]?.level,
    valid,
  }).toEqual({
    fieldValid: false,
    formValid: false,
    riskLevel: 'risk',
    valid: false,
  });
});

it('runs all configured issue events when no event type is provided', async () => {
  const context = setup();

  const [valid, issues] = await context.core.validate();

  expect({
    nestedNotices: context.core.store.state.fields['~root.nested.value'].issues.notice.map(issue => issue.level),
    nameRisks: context.core.store.state.fields['~root.name'].issues.risk.map(issue => issue.level),
    nameWarnings: context.core.store.state.fields['~root.name'].issues.warning.map(issue => issue.level),
    returnedIssues: flattenIssues(issues).map(issue => `${issue.type}:${issue.level}`),
    valid,
  }).toEqual({
    nestedNotices: ['notice'],
    nameRisks: ['risk'],
    nameWarnings: ['warning'],
    returnedIssues: ['change:warning', 'change:notice', 'submit:risk'],
    valid: false,
  });
});

it('refreshes event issues but preserves manual issues when no event type is provided', async () => {
  const context = setup();

  context.field.setIssues('name', {
    warning: [
      { level: 'warning', issue: { code: 'custom', message: 'manual', path: ['name'] } as never },
      { type: 'change', level: 'warning', issue: { code: 'custom', message: 'old change', path: ['name'] } as never },
    ],
    risk: [{ type: 'submit', level: 'risk', issue: { code: 'custom', message: 'old submit', path: ['name'] } as never }],
  });
  context.core.set('name', 'valid name');

  const [valid, issues] = await context.core.validate('name');

  expect({
    preservedMessages: context.core.store.state.fields['~root.name'].issues.warning.map(issue => issue.issue.message),
    returnedIssues: issues,
    valid,
  }).toEqual({
    preservedMessages: ['manual'],
    returnedIssues: { error: [], notice: [], warning: [], risk: [] },
    valid: true,
  });
});

it('clears issues when the event has no configured validators', async () => {
  const context = setup();

  context.field.setIssues('name', {
    warning: [{ type: 'blur', level: 'warning', issue: { code: 'custom', message: 'existing', path: ['name'] } as never }],
  });
  const [valid, issues] = await context.core.validate('name', { type: 'blur' });

  expect({
    returnedIssues: issues,
    storedIssues: context.core.store.state.fields['~root.name'].issues,
    valid,
  }).toEqual({
    returnedIssues: { error: [], notice: [], warning: [], risk: [] },
    storedIssues: {
      error: [],
      notice: [],
      warning: [],
      risk: [],
    },
    valid: true,
  });
});

it('preserves issues from other events when validating a single event', async () => {
  const context = setup();

  await context.core.validate('name', { type: 'change' });

  const [valid, issues] = await context.core.validate('name', { type: 'submit' });

  expect({
    returnedRisks: issues.risk.map(issue => issue.level),
    storedRisks: context.core.store.state.fields['~root.name'].issues.risk.map(issue => issue.level),
    storedWarnings: context.core.store.state.fields['~root.name'].issues.warning.map(issue => issue.level),
    valid,
  }).toEqual({
    returnedRisks: ['risk'],
    storedRisks: ['risk'],
    storedWarnings: ['warning'],
    valid: false,
  });
});

it('preserves issues from other events when the event has no configured validators', async () => {
  const context = setup();

  await context.core.validate('name', { type: 'change' });
  const [valid, issues] = await context.core.validate('name', { type: 'focus' });

  expect({
    returnedIssues: issues,
    storedWarnings: context.core.store.state.fields['~root.name'].issues.warning.map(issue => issue.level),
    valid,
  }).toEqual({
    returnedIssues: { error: [], notice: [], warning: [], risk: [] },
    storedWarnings: ['warning'],
    valid: true,
  });
});

it('ignores stale async issues when values change before validation resolves', async () => {
  const asyncWarningSchema = {
    '~standard': {
      validate: async (values: Values) => {
        await new Promise(resolve => setTimeout(resolve, values.name === 'bad' ? 30 : 0));
        return values.name === 'valid name' ? {} : { issues: [{ code: 'custom', message: 'Stale warning', path: ['name'] }] as never };
      },
    },
  };
  const core = new FormCore<Values>({
    schema,
    defaultValues: {
      ...defaultValues,
      name: '',
    },
    checks: {
      warning: {
        validate: {
          change: asyncWarningSchema as never,
        },
      },
    },
  });
  const fields = new FormCoreFields<Values>({ core });
  const field = new FormCoreField<Values>({ core, fields });

  field.change('name', 'bad');
  field.change('name', 'valid name');
  await new Promise(resolve => setTimeout(resolve, 60));

  expect({
    issues: core.store.state.fields['~root.name'].issues,
    value: core.store.state.values.name,
  }).toEqual({
    issues: { error: [], warning: [] },
    value: 'valid name',
  });
});

it('ignores stale async issues when the target value changes before validation resolves', async () => {
  const gate = deferred();
  const asyncWarningSchema = {
    '~standard': {
      validate: async () => {
        await gate.promise;

        return {
          issues: [{ code: 'custom', message: 'Stale warning', path: ['name'] }] as never,
        };
      },
    },
  };
  const core = new FormCore<Values>({
    schema,
    defaultValues,
    checks: {
      warning: {
        validate: {
          change: asyncWarningSchema as never,
        },
      },
    },
  });

  const validation = core.validate('name', { type: 'change' });
  core.set('name', 'valid name');

  gate.resolve();
  const [valid, issues] = await validation;

  expect({
    returnedIssues: issues,
    storedIssues: core.store.state.fields['~root.name'].issues,
    valid,
  }).toEqual({
    returnedIssues: { error: [], warning: [] },
    storedIssues: { error: [], warning: [] },
    valid: true,
  });
});

it('keeps async issues current when an unrelated target changes before validation resolves', async () => {
  const gate = deferred();
  const asyncWarningSchema = {
    '~standard': {
      validate: async () => {
        await gate.promise;

        return {
          issues: [{ code: 'custom', message: 'Name warning', path: ['name'] }] as never,
        };
      },
    },
  };
  const core = new FormCore<Values>({
    schema,
    defaultValues,
    checks: {
      warning: {
        validate: {
          change: asyncWarningSchema as never,
        },
      },
    },
  });

  const validation = core.validate('name', { type: 'change' });
  core.set('nested.value', 'changed');

  gate.resolve();
  const [valid, issues] = await validation;

  expect({
    returnedWarnings: issues.warning.length,
    storedWarnings: core.store.state.fields['~root.name'].issues.warning.length,
    valid,
  }).toEqual({
    returnedWarnings: 1,
    storedWarnings: 1,
    valid: true,
  });
});

it('types issues validation results as tuple with issues grouped by level', async () => {
  const context = setup();
  const result = await context.core.validate('name', { type: 'change' });

  expectTypeOf(result).toEqualTypeOf<[boolean, FormIssuesByLevel<string>]>();
});
