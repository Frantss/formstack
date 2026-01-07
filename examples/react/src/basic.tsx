import { ArrayField, Field, Subscribe, useForm } from 'oxform-react';
import { useEffect } from 'react';
import z from 'zod';

const schema = z.object({
  name: z.string().min(3),
  directions: z.string().array().optional(),
});

export const Example_Basic = () => {
  const form = useForm({
    schema,
    defaultValues: { name: '3213', directions: undefined },
    validate: { change: schema },
  });

  useEffect(() => {
    (window as any)['_form'] = form;
  }, [form]);

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        event.stopPropagation();

        return form.submit(console.log, console.error)();
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

      <button type='button' onClick={() => form.array.append('directions', 'test')}>
        Add new
      </button>

      <ArrayField form={form} name='directions'>
        {array =>
          array.fields?.map((_, index) => {
            return (
              <div key={index}>
                <Field form={form} name={`directions.${index}`}>
                  {field => <input type='text' {...field.props} />}
                </Field>
                <button type='button' onClick={() => array.move(index, index - 1)}>
                  Move up
                </button>
                <button type='button' onClick={() => array.move(index, index + 1)}>
                  Move down
                </button>
                <button type='button' onClick={() => array.remove(index)}>
                  Remove
                </button>
              </div>
            );
          })
        }
      </ArrayField>

      <button type='submit'>Submit</button>

      <Subscribe api={form} selector={state => state.status.submits}>
        {submits => <div>Submits: {submits}</div>}
      </Subscribe>
    </form>
  );
};
