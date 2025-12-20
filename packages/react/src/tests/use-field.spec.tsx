import { useField } from '#use-field';
import { FormApi } from 'oxform-core';
import 'react';
import { expect, it, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { z } from 'zod';

const setup = async () => {
  const form = new FormApi({
    schema: z.object({
      name: z.string(),
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
        <input {...field.props} />
        <button type='button'>outside</button>
      </>
    );
  };

  const utils = await render(<Component />);

  const ui = {
    input: utils.getByRole('textbox'),
    outside: utils.getByRole('button'),
  };

  return { utils, ui, form };
};

it("should update the form's values on change", async () => {
  const { form, ui } = await setup();

  await userEvent.clear(ui.input);
  await userEvent.type(ui.input, 'Jane');

  expect(form.store.state.values.name).toBe('Jane');
});

it('should mark the field as touched on focus', async () => {
  const { form, ui } = await setup();

  await ui.input.click();

  const meta = form.store.state.fields['name'];

  expect(meta).toBeDefined();
  expect(meta.touched).toBe(true);
});

it('should mark the fields as blurred on blur', async () => {
  const { form, ui } = await setup();

  await ui.input.click();
  await ui.outside.click(); // blur the input

  const meta = form.store.state.fields['name'];

  expect(meta).toBeDefined();
  expect(meta.blurred).toBe(true);
});

it('should keep the field as pristine when field is not dirty', async () => {
  const { form, ui } = await setup();

  await ui.input.click();
  await ui.outside.click(); // blur the input

  const meta = form.store.state.fields['name'];

  expect(meta).toBeDefined();
  expect(meta.pristine).toBe(true);
});

test('default is true when value is equal to default value', async () => {
  const { form, ui } = await setup();

  await userEvent.clear(ui.input);
  await userEvent.type(ui.input, 'Jane');
  await userEvent.clear(ui.input);
  await userEvent.type(ui.input, 'John');

  const meta = form.store.state.fields['name'];

  expect(meta.default).toBe(true);
});

test('default is false when value is not equal to default value', async () => {
  const { form, ui } = await setup();

  await userEvent.clear(ui.input);
  await userEvent.type(ui.input, 'Jane');

  const meta = form.store.state.fields['name'];

  expect(meta.default).toBe(false);
});
