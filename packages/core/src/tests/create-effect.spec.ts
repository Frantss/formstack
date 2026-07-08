import { createEffect } from '#form/create-effect';
import { createForm } from '#form/create-form';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({
  name: z.string(),
});

const defaultValues = {
  name: 'name',
};

const setup = () => {
  const form = createForm({
    schema,
    defaultValues,
  });
  const effect = vi.fn();

  return {
    effect,
    form,
    subscription: createEffect(form, state => ({ name: state.values.name }), effect),
  };
};

it('does not run the effect when the selected state is deeply equal', () => {
  const { effect, form, subscription } = setup();

  form.field.change('name', 'name');

  expect(effect).not.toHaveBeenCalled();
  subscription.unsubscribe();
});

it('runs the effect with the changed selected state', () => {
  const { effect, form, subscription } = setup();

  form.field.change('name', 'updated');

  expect(effect.mock.calls).toEqual([[{ name: 'updated' }]]);
  subscription.unsubscribe();
});

it('stops running the effect after unsubscribe', () => {
  const { effect, form, subscription } = setup();

  form.field.change('name', 'updated');

  subscription.unsubscribe();
  form.field.change('name', 'final');

  expect(effect).toHaveBeenCalledTimes(1);
});
