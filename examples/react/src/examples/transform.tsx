import { Field, Subscribe, useForm } from 'oxform-react';
import z from 'zod';
import { FieldError } from '../components/field-error';
import { FormStatus } from '../components/form-status';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  monthlyIncome: z.number().min(0, 'Monthly income must be 0 or more'),
  taxRate: z.number().min(0, 'Tax rate must be 0 or more').max(1, 'Tax rate must be 1 or less'),
});

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const Example_Transform = () => {
  const form = useForm({
    schema,
    defaultValues: {
      firstName: '',
      lastName: '',
      monthlyIncome: 5500,
      taxRate: 0.22,
    },
    checks: {
      error: {
        validate: { change: schema },
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
      <Field form={form} name='firstName'>
        {field => (
          <div className='field'>
            <label className='field-label'>First name</label>
            <input className='input' type='text' placeholder='Enter text...' {...field.props} />
            <FieldError field={field} />
          </div>
        )}
      </Field>

      <Field form={form} name='lastName'>
        {field => (
          <div className='field'>
            <label className='field-label'>Last name</label>
            <input className='input' type='text' placeholder='Enter text...' {...field.props} />
            <FieldError field={field} />
          </div>
        )}
      </Field>

      <Field form={form} name='monthlyIncome'>
        {field => (
          <div className='field'>
            <label className='field-label'>Monthly income (USD)</label>
            <input
              className='input'
              type='number'
              placeholder='Enter number...'
              {...field.props}
              onChange={event => {
                const next = event.currentTarget.valueAsNumber;
                field.change(Number.isNaN(next) ? 0 : next);
              }}
            />
            <FieldError field={field} />
          </div>
        )}
      </Field>

      <Field form={form} name='taxRate'>
        {field => (
          <div className='field'>
            <label className='field-label'>Tax rate (0 - 1)</label>
            <input
              className='input'
              type='number'
              min={0}
              max={1}
              step={0.01}
              placeholder='Enter number...'
              {...field.props}
              onChange={event => {
                const next = event.currentTarget.valueAsNumber;
                field.change(Number.isNaN(next) ? 0 : next);
              }}
            />
            <FieldError field={field} />
          </div>
        )}
      </Field>

      <Subscribe
        api={form}
        selector={state => {
          const fullName = `${state.values.firstName} ${state.values.lastName}`.trim().replace(/\s+/g, ' ');
          const annualGross = state.values.monthlyIncome * 12;
          const annualNet = annualGross * (1 - state.values.taxRate);

          return {
            displayName: fullName.length > 0 ? fullName.toUpperCase() : 'ANONYMOUS',
            initials:
              fullName
                .split(' ')
                .filter(Boolean)
                .map(part => part[0]?.toUpperCase())
                .join('') || 'NA',
            annualGross: money.format(annualGross),
            annualNet: money.format(annualNet),
            payload: JSON.stringify(
              {
                fullName,
                annualGross,
                annualNet,
                effectiveTaxRate: `${Math.round(state.values.taxRate * 100)}%`,
              },
              null,
              2,
            ),
          };
        }}
      >
        {summary => (
          <div className='status'>
            <div className='status-title'>Transformed subscribe output</div>
            <div className='status-tag' data-on={true}>
              <span className='status-dot' />
              name: {summary.displayName}
            </div>
            <div className='status-tag' data-on={true}>
              <span className='status-dot' />
              initials: {summary.initials}
            </div>
            <div className='status-tag' data-on={true}>
              <span className='status-dot' />
              gross/year: {summary.annualGross}
            </div>
            <div className='status-tag' data-on={true}>
              <span className='status-dot' />
              net/year: {summary.annualNet}
            </div>
            <pre className='transform-json'>{summary.payload}</pre>
          </div>
        )}
      </Subscribe>

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
