import { Field, useForm } from 'oxform-react';
import z from 'zod';
import { FieldError } from '../components/field-error';
import { FieldStatus } from '../components/field-status';
import { FormStatus } from '../components/form-status';

const trustedDomains = ['company.com', 'oxform.dev'];

const schema = z.object({
  email: z.email('Enter a valid email address'),
  fullName: z.string().min(3, 'Enter your full name'),
});

const untrustedProviderSchema = z.object({
  email: z.email().refine(value => {
    const [, domain = ''] = value.toLowerCase().split('@');
    return trustedDomains.includes(domain);
  }, 'This provider is valid, but may have trouble receiving transactional emails.'),
});

const blockedProviderSchema = z.object({
  email: z.email().refine(value => {
    return !value.toLowerCase().endsWith('@blocked.example');
  }, 'This domain is blocked for delivery risk reasons.'),
});

export const Example_Issues = () => {
  const form = useForm({
    schema,
    defaultValues: {
      email: '',
      fullName: '',
    },
    checks: {
      error: {
        validate: {
          change: schema,
          submit: schema,
        },
      },
      warning: {
        blocking: false,
        validate: {
          change: untrustedProviderSchema,
        },
      },
      risk: {
        blocking: true,
        validate: {
          submit: blockedProviderSchema,
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
      <Field form={form} name='fullName'>
        {field => (
          <div className='field'>
            <label className='field-label'>Full Name</label>
            <input className='input' type='text' placeholder='Ada Lovelace' {...field.props} />
            <FieldError field={field} />
            <FieldStatus field={field} />
          </div>
        )}
      </Field>

      <Field form={form} name='email'>
        {field => {
          const issues = Object.values(field.state.issues).flat();

          return (
            <div className='field'>
              <label className='field-label'>Email</label>
              <input className='input' type='email' placeholder='ada@gmail.com' {...field.props} />
              <FieldError field={field} />

              {issues.length > 0 && (
                <div className='field-issues'>
                  {issues.map((issue, index) => (
                    <div
                      key={`${issue.level}-${issue.issue.message}-${index}`}
                      className='field-issue'
                      data-level={issue.level}
                    >
                      <strong>{issue.level}</strong>
                      <span>{issue.issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <span className='field-hint'>
                Try `ada@gmail.com` for a warning, `ada@company.com` for clean state, or `ada@blocked.example` for a
                blocking submit issue.
              </span>
              <FieldStatus field={field} />
            </div>
          );
        }}
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
