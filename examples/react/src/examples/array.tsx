import { ArrayField, Field, useForm } from 'oxform-react';
import { faker } from '@faker-js/faker';
import { useEffect } from 'react';
import { useState } from 'react';
import z from 'zod';
import { FieldStatus } from '../components/field-status';
import { FormStatus } from '../components/form-status';

const schema = z.object({
  directions: z.string().array(),
});

const randomDirection = () => faker.location.streetAddress();

export const Example_Array = () => {
  const [insertIndex, setInsertIndex] = useState('0');

  const form = useForm({
    schema,
    defaultValues: { directions: [] },
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
      <div className='field'>
        <label className='field-label'>Directions</label>
        <div className='form-actions'>
          <button
            className='btn'
            type='button'
            onClick={() => form.array.append('directions', () => randomDirection())}
          >
            + Append
          </button>
          <button
            className='btn'
            type='button'
            onClick={() => form.array.prepend('directions', () => randomDirection())}
          >
            + Prepend
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              className='input'
              type='number'
              min='0'
              placeholder='Index'
              value={insertIndex}
              onChange={event => setInsertIndex(event.target.value)}
            />
            <button
              className='btn'
              type='button'
              onClick={() => {
                const parsedIndex = Number.parseInt(insertIndex, 10);
                form.array.insert('directions', Number.isNaN(parsedIndex) ? 0 : parsedIndex, () => randomDirection());
              }}
            >
              + Insert at index
            </button>
          </div>
        </div>
      </div>

      <ArrayField form={form} name='directions'>
        {array => (
          <>
            {array.ids?.map((id, index) => (
              <div className='array-row' key={id}>
                <Field form={form} name={`directions.${index}`}>
                  {field => (
                    <>
                      <div className='array-row-main'>
                        <input className='input' type='text' placeholder={`Value ${index + 1}`} {...field.props} />
                        <div className='array-actions'>
                          <button className='btn btn-sm' type='button' onClick={() => array.move(index, index - 1)}>
                            Up
                          </button>
                          <button className='btn btn-sm' type='button' onClick={() => array.move(index, index + 1)}>
                            Down
                          </button>
                          <button
                            className='btn btn-sm'
                            type='button'
                            disabled={!array.ids || array.ids.length < 2}
                            onClick={() => {
                              if (!array.ids || array.ids.length < 2) return;

                              let randomIndex = Math.floor(Math.random() * array.ids.length);

                              if (randomIndex === index) {
                                randomIndex = (randomIndex + 1) % array.ids.length;
                              }

                              array.swap(index, randomIndex);
                            }}
                          >
                            Swap random
                          </button>
                          <button className='btn btn-sm btn-danger' type='button' onClick={() => array.remove(index)}>
                            Remove
                          </button>
                        </div>
                      </div>
                      <FieldStatus field={field} />
                    </>
                  )}
                </Field>
              </div>
            ))}
          </>
        )}
      </ArrayField>

      <hr className='divider' />

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
