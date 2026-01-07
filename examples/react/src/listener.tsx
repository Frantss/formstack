import { Field, Subscribe, useFieldApi, useForm, useListener } from 'oxform-react';
import { useEffect } from 'react';
import z from 'zod';

const schema = z.object({
  name: z.string().min(3),
  directions: z.string().array().optional(),
});

export const Example_Listener = () => {
  const form = useForm({
    schema,
    defaultValues: { name: '3213', directions: undefined },
    validate: { change: schema },
  });

  const name = useFieldApi({ form, name: 'name' });

  useEffect(() => {
    (window as any)['_form'] = form;
  }, [form]);

  useListener(
    form,
    state => state.status.submits,
    submits => {
      console.info({ submits });
    },
  );

  useListener(
    name,
    state => state.value,
    name => {
      console.info({ name });
    },
  );

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        event.stopPropagation();

        return form.submit(() => {
          console.log('submit');
        })();
      }}
    >
      <Field form={form} name='name'>
        {field => (
          <div>
            <input type='text' {...field.props} />
            {!field.state.meta.valid && field.state.errors.map(error => error.message).join(', ')}
          </div>
        )}
      </Field>

      <button type='submit'>Submit</button>

      <Subscribe api={form} selector={state => state.status.submits}>
        {submits => <div>Submits: {submits}</div>}
      </Subscribe>
    </form>
  );
};
