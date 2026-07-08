import { Field, useForm } from 'oxform-react';
import { useEffect } from 'react';
import z from 'zod';
import { FieldError } from '../components/field-error';
import { FieldStatus } from '../components/field-status';
import { FormStatus } from '../components/form-status';

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18, 'Must be at least 18').max(120, 'Must be at most 120'),
  bio: z.string().max(200, 'Bio must be 200 characters or less').optional(),
  role: z.enum(['developer', 'designer', 'manager', 'other']),
});

export const Example_Basic = () => {
  const form = useForm({
    schema,
    defaultValues: {
      name: '',
      email: '',
      age: 0,
      bio: '',
      role: 'developer' as const,
    },
    checks: {
      error: {
        validate: { change: schema },
      },
    },
  });

  useEffect(() => {
    (window as any)['_form'] = form;
  }, [form]);

  return (
    <form
      className='form'
      onSubmit={event => {
        event.preventDefault();
        event.stopPropagation();

        return form.submit(console.log, console.error)();
      }}
    >
      <Field form={form} name='name'>
        {field => (
          <div className='field'>
            <label className='field-label'>Name</label>
            <input className='input' type='text' placeholder='Enter text...' {...field.props} />
            <FieldError field={field} />
            <FieldStatus field={field} />
          </div>
        )}
      </Field>

      <Field form={form} name='email'>
        {field => (
          <div className='field'>
            <label className='field-label'>Email</label>
            <input className='input' type='email' placeholder='Enter value...' {...field.props} />
            <FieldError field={field} />
            <FieldStatus field={field} />
          </div>
        )}
      </Field>

      <Field form={form} name='age'>
        {field => (
          <div className='field'>
            <label className='field-label'>Age</label>
            <input
              className='input'
              type='number'
              placeholder='Enter number...'
              {...field.props}
              onChange={event => {
                const next = event.currentTarget.valueAsNumber;
                // if (Number.isNaN(next)) return;
                field.change(next);
              }}
            />
            <FieldError field={field} />
            <FieldStatus field={field} />
          </div>
        )}
      </Field>

      <Field form={form} name='bio'>
        {field => (
          <div className='field'>
            <label className='field-label'>Bio</label>
            <textarea className='input' placeholder='Enter text...' rows={3} {...field.props} />
            <FieldError field={field} />
            <FieldStatus field={field} />
          </div>
        )}
      </Field>

      <Field form={form} name='role'>
        {field => (
          <div className='field'>
            <label className='field-label'>Role</label>
            <select className='input' {...field.props}>
              <option value='developer'>Developer</option>
              <option value='designer'>Designer</option>
              <option value='manager'>Manager</option>
              <option value='other'>Other</option>
            </select>
            <FieldError field={field} />
            <FieldStatus field={field} />
          </div>
        )}
      </Field>

      <div className='form-actions'>
        <button className='btn btn-primary' type='submit'>
          Submit
        </button>
        <button className='btn' type='button' onClick={() => form.reset()}>
          Reset
        </button>
      </div>

      <FormStatus form={form} />
    </form>
  );
};
