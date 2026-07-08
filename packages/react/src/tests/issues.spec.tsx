import { Field } from '#field';
import { useArrayField } from '#use-array-field';
import { useField } from '#use-field';
import { useForm } from '#use-form';
import { useFormStatus } from '#use-form-status';
import type { FormIssuesByLevel } from 'oxform-core';
import { FormApi } from 'oxform-core';
import 'react';
import { expect, expectTypeOf, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.email(),
});

const issuesSetup = async () => {
  const form = new FormApi({
    schema: emailSchema,
    defaultValues: {
      email: '',
    },
    checks: {
      error: {
        validate: {
          change: emailSchema,
          submit: emailSchema,
        },
      },
      warning: {
        blocking: false,
        validate: {
          change: z.object({
            email: z.email().refine(value => value.endsWith('@company.com'), 'Untrusted provider'),
          }),
        },
      },
      risk: {
        blocking: true,
        validate: {
          submit: z.object({
            email: z.email().refine(value => !value.endsWith('@blocked.example'), 'Blocked provider'),
          }),
        },
      },
    },
  });

  const Component = () => {
    const field = useField({ form, name: 'email' });
    const status = useFormStatus({ form });
    const issues = Object.values(field.state.issues).flat();

    return (
      <>
        <input
          value={field.state.value}
          ref={field.register}
          onChange={event => field.change(event.target.value)}
          onBlur={() => field.blur()}
          onFocus={() => field.focus()}
        />
        <button
          type='button'
          onClick={() =>
            form.submit(
              async () => {},
              async () => {},
            )()
          }
        >
          submit
        </button>
        <output data-testid='field-issues-count'>{String(issues.length)}</output>
        <output data-testid='field-first-level'>{issues[0]?.level ?? 'none'}</output>
        <output data-testid='field-valid'>{String(field.state.status.valid)}</output>
        <output data-testid='form-valid'>{String(status.valid)}</output>
      </>
    );
  };

  const utils = await render(<Component />);

  return {
    form,
    ui: {
      input: utils.getByRole('textbox'),
      submit: utils.getByRole('button'),
      fieldIssuesCount: utils.getByTestId('field-issues-count'),
      fieldFirstLevel: utils.getByTestId('field-first-level'),
      fieldValid: utils.getByTestId('field-valid'),
      formValid: utils.getByTestId('form-valid'),
    },
  };
};

const arraySetup = async () => {
  const form = new FormApi({
    schema: z.object({
      tags: z.string().array(),
    }),
    defaultValues: {
      tags: ['alpha'],
    },
    checks: {
      warning: {},
    },
  });

  const Component = () => {
    const array = useArrayField({ form, name: 'tags' });
    // @ts-expect-error array field status no longer exposes hasIssues
    void array.state.status.hasIssues;

    return (
      <>
        <button
          type='button'
          onClick={() => {
            form.field.setIssues('tags', {
              warning: [
                {
                  level: 'warning',
                  issue: { code: 'custom', message: 'Array warning', path: ['tags'] } as never,
                },
              ],
            });
          }}
        >
          mark issues
        </button>
        <output data-testid='array-issues-count'>{String(Object.values(array.state.issues).flat().length)}</output>
      </>
    );
  };

  const utils = await render(<Component />);

  return {
    ui: {
      markIssues: utils.getByRole('button'),
      issuesCount: utils.getByTestId('array-issues-count'),
    },
  };
};

it('reactively exposes non-blocking issues through useField and useFormStatus', async () => {
  const { ui } = await issuesSetup();

  await userEvent.type(ui.input, 'ada@gmail.com');

  expect(ui.fieldIssuesCount.element().textContent).toBe('1');
  expect(ui.fieldFirstLevel.element().textContent).toBe('warning');
  expect(ui.fieldValid.element().textContent).toBe('true');
  expect(ui.formValid.element().textContent).toBe('true');
});

it('clears issues reactively when the field returns to a clean state', async () => {
  const { ui } = await issuesSetup();

  await userEvent.type(ui.input, 'ada@gmail.com');
  await userEvent.clear(ui.input);
  await userEvent.type(ui.input, 'ada@company.com');

  expect(ui.fieldIssuesCount.element().textContent).toBe('0');
  expect(ui.fieldFirstLevel.element().textContent).toBe('none');
});

it('surfaces blocking issues after submit through useFormStatus', async () => {
  const { form, ui } = await issuesSetup();

  await userEvent.type(ui.input, 'ada@blocked.example');
  await ui.submit.click();

  expect(form.field.issues('email').risk).toHaveLength(1);
  expect(ui.fieldIssuesCount.element().textContent).toBe('2');
  expect(ui.formValid.element().textContent).toBe('false');
});

it('reactively exposes issues through useArrayField', async () => {
  const { ui } = await arraySetup();

  await ui.markIssues.click();

  expect(ui.issuesCount.element().textContent).toBe('1');
});

it('preserves literal issue levels through useForm and Field', async () => {
  const Component = () => {
    const form = useForm({
      schema: emailSchema,
      defaultValues: {
        email: '',
      },
      checks: {
        warning: {
          validate: {
            change: z.object({
              email: z.email().refine(value => value.endsWith('@company.com'), 'Untrusted provider'),
            }),
          },
        },
        risk: {
          blocking: true,
          validate: {
            submit: z.object({
              email: z.email().refine(value => !value.endsWith('@blocked.example'), 'Blocked provider'),
            }),
          },
        },
      },
    });
    const field = useField({ form, name: 'email' });
    const status = useFormStatus({ form });

    expectTypeOf(field.state.issues).toEqualTypeOf<FormIssuesByLevel<'error' | 'warning' | 'risk'>>();
    expectTypeOf<(typeof field.state.issues.error)[number]['level']>().toEqualTypeOf<'error'>();
    expectTypeOf<(typeof field.state.issues.warning)[number]['level']>().toEqualTypeOf<'warning'>();
    expectTypeOf<(typeof field.state.issues.risk)[number]['level']>().toEqualTypeOf<'risk'>();
    // @ts-expect-error issues no longer expose priority
    void field.state.issues.warning[0]?.priority;
    // @ts-expect-error form status no longer exposes ranked issue levels
    void form.status.highestIssueLevel;
    // @ts-expect-error useFormStatus no longer exposes ranked issue levels
    void status.highestIssueLevel;
    // @ts-expect-error field status no longer exposes hasIssues
    void field.state.status.hasIssues;
    // @ts-expect-error form status no longer exposes hasIssues
    void form.status.hasIssues;
    // @ts-expect-error useFormStatus no longer exposes hasIssues
    void status.hasIssues;

    return (
      <Field form={form} name='email'>
        {fieldFromComponent => {
          expectTypeOf(fieldFromComponent.state.issues).toEqualTypeOf<FormIssuesByLevel<'error' | 'warning' | 'risk'>>();
          // @ts-expect-error Field render prop status no longer exposes hasIssues
          void fieldFromComponent.state.status.hasIssues;

          return null;
        }}
      </Field>
    );
  };

  await render(<Component />);
});
