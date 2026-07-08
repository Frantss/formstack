import { Field, Subscribe, useForm } from 'oxform-react';
import z from 'zod';
import { FieldError } from '../components/field-error';
import { FormStatus } from '../components/form-status';

const taken = ['admin', 'test', 'user', 'oxform'];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const schema = z.object({
  username: z.string().min(3),
  email: z.email(),
});

const asyncSchema = z.object({
  username: z
    .string()
    .min(3)
    .refine(async value => {
      await delay(2000);
      return !taken.includes(value.toLowerCase());
    }, 'Username is already taken'),
  email: z.email().refine(async value => {
    await delay(4000);
    return !value.endsWith('@example.com');
  }, 'We do not accept example.com emails'),
});

export const Example_Async = () => {
  const form = useForm({
    schema,
    defaultValues: { username: '', email: '' },
    checks: {
      error: {
        validate: {
          change: asyncSchema,
          submit: asyncSchema,
        },
      },
    },
  });

  return (
    <form
      className='form'
      onSubmit={event => {
        event.preventDefault();
        event.stopPropagation();

        return form.submit(console.log, console.error)();
      }}
    >
      <Field form={form} name='username'>
        {field => (
          <div className='field'>
            <label className='field-label'>Username</label>
            <input className='input' type='text' placeholder='Enter text...' {...field.props} />
            <FieldError field={field} />
            <span className='field-hint'>Try: {taken.map(u => `"${u}"`).join(', ')}</span>
          </div>
        )}
      </Field>

      <Field form={form} name='email'>
        {field => (
          <div className='field'>
            <label className='field-label'>Email</label>
            <input className='input' type='text' placeholder='Enter value...' {...field.props} />
            <FieldError field={field} />
            <span className='field-hint'>Try: "foo@example.com"</span>
          </div>
        )}
      </Field>

      <div className='form-actions'>
        <Subscribe api={form} selector={state => state.status}>
          {status => (
            <button className='btn btn-primary' type='submit' disabled={status.validating || status.submitting}>
              {status.validating || status.submitting ? (
                <>
                  <span className='spinner' />
                  {status.validating ? 'Validating...' : 'Submitting...'}
                </>
              ) : (
                'Submit'
              )}
            </button>
          )}
        </Subscribe>
        <button className='btn' type='button' onClick={() => form.reset()}>
          Reset
        </button>
      </div>

      <FormStatus form={form} />
    </form>
  );
};
