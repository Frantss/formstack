import { Field, useFieldApi, useForm, useFormEffect } from 'oxform-react';
import { useEffect, useRef, useState } from 'react';
import z from 'zod';
import { FieldError } from '../components/field-error';
import { FormStatus } from '../components/form-status';

const schema = z.object({
  name: z.string().min(3),
  directions: z.string().array().optional(),
});

export const Example_Effect = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const logsListRef = useRef<HTMLOListElement | null>(null);

  const appendLog = (message: string) => {
    setLogs(current => {
      const next = [...current, message];

      requestAnimationFrame(() => {
        if (!logsListRef.current) {
          return;
        }

        logsListRef.current.scrollTop = logsListRef.current.scrollHeight;
      });

      return next;
    });
  };

  const form = useForm({
    schema,
    defaultValues: { name: '3213', directions: undefined },
    checks: {
      error: {
        validate: { change: schema },
      },
    },
  });

  const name = useFieldApi({ form, name: 'name' });

  useEffect(() => {
    (window as any)['_form'] = form;
  }, [form]);

  useFormEffect(
    form,
    state => state.status.submits,
    submits => {
      appendLog(`[form] submits -> ${String(submits)}`);
      console.info({ submits });
    },
  );

  useFormEffect(
    name,
    state => state.value,
    fieldName => {
      appendLog(`[field:name] value -> ${String(fieldName)}`);
      console.info({ name: fieldName });
    },
  );

  return (
    <form
      className='form'
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
          <div className='field'>
            <label className='field-label'>Name</label>
            <input className='input' type='text' placeholder='Enter text...' {...field.props} />
            <FieldError field={field} />
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

      <div className='logs'>
        <div className='logs-header'>
          <span>Effect Logs</span>
          <button
            className='logs-clear-btn'
            type='button'
            onClick={() => {
              setLogs([]);
            }}
          >
            Clear logs
          </button>
        </div>
        <ol className='logs-list' ref={logsListRef}>
          {logs.map((log, index) => (
            <li className='logs-item' key={`${index}-${log}`}>
              {log}
            </li>
          ))}
        </ol>
      </div>
    </form>
  );
};
