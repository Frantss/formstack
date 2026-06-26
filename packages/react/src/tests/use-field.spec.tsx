import { useField } from '#use-field';
import { FormApi } from 'oxform-core';
import 'react';
import { expect, it, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vite-plus/test/browser';
import { z } from 'zod';

const setup = async () => {
  const form = new FormApi({
    schema: z.object({
      name: z.string(),
      other: z.string().array().optional(),
      nested: z.object({
        deep: z.object({
          deeper: z.string().array(),
        }),
      }),
    }),
    defaultValues: {
      name: 'John',
      nested: {
        deep: {
          deeper: ['hello'],
        },
      },
    },
  });

  const Component = () => {
    const field = useField({ form, name: 'name' });

    return (
      <>
        <input
          value={field.state.value}
          ref={field.register}
          onChange={event => field.change(event.target.value)}
          onBlur={() => field.blur()}
          onFocus={() => field.focus()}
        />
        <output data-testid='field-id'>{`${field.id}:${field.state.id}`}</output>
        <button type='button'>outside</button>
      </>
    );
  };

  const utils = await render(<Component />);

  const ui = {
    input: utils.getByRole('textbox'),
    outside: utils.getByRole('button'),
    fieldId: utils.getByTestId('field-id'),
  };

  return { utils, ui, form };
};

it('should expose the field id', async () => {
  const { ui } = await setup();
  const [id, stateId] = ui.fieldId.element().textContent?.split(':') ?? [];

  expect(id).toBeDefined();
  expect(id).toBe(stateId);
});

it("should update the form's values on change", async () => {
  const { form, ui } = await setup();

  await userEvent.clear(ui.input);
  await userEvent.type(ui.input, 'Jane');

  expect(form.store.state.values.name).toBe('Jane');
});

it('should mark the field as touched on focus', async () => {
  const { form, ui } = await setup();

  await ui.input.click();

  const status = form.field.status('name');

  expect(status).toBeDefined();
  expect(status.touched).toBe(true);
});

it('should mark the fields as blurred on blur', async () => {
  const { form, ui } = await setup();

  await ui.input.click();
  await ui.outside.click(); // blur the input

  const status = form.field.status('name');

  expect(status).toBeDefined();
  expect(status.blurred).toBe(true);
});

it('should keep the field as pristine when field is not dirty', async () => {
  const { form, ui } = await setup();

  await ui.input.click();
  await ui.outside.click(); // blur the input

  const status = form.field.status('name');

  expect(status).toBeDefined();
  expect(status.pristine).toBe(true);
});

test('default is true when value is equal to default value', async () => {
  const { form, ui } = await setup();

  await userEvent.clear(ui.input);
  await userEvent.type(ui.input, 'Jane');
  await userEvent.clear(ui.input);
  await userEvent.type(ui.input, 'John');

  const status = form.field.status('name');

  expect(status.default).toBe(true);
});

test('default is false when value is not equal to default value', async () => {
  const { form, ui } = await setup();

  await userEvent.clear(ui.input);
  await userEvent.type(ui.input, 'Jane');

  const status = form.field.status('name');

  expect(status.default).toBe(false);
});
