import { FormApi } from '#form-api';
import { describe, expect, it } from 'vitest';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  email: z.string().email('Invalid email format'),
  nested: z.object({
    deep: z.object({
      value: z.string(),
      array: z.string().array(),
    }),
  }),
});

const defaultValues = {
  name: 'Default Name',
  email: 'default@example.com',
  nested: {
    deep: {
      value: 'default value',
      array: ['default1', 'default2'],
    },
  },
};

const changedValues = {
  name: 'Changed Name',
  email: 'changed@example.com',
  nested: {
    deep: {
      value: 'changed value',
      array: ['changed1', 'changed2', 'changed3'],
    },
  },
};

const setup = async ({ values }: { values: z.infer<typeof schema> }) => {
  const form = new FormApi({
    schema,
    defaultValues,
    values,
  });

  form['~mount']();

  return { form };
};

describe('resets form values', () => {
  it('should reset all values to defaultValues', async () => {
    const { form } = await setup({ values: changedValues });

    expect(form.values).toEqual(changedValues);

    form.reset();

    expect(form.values).toEqual(defaultValues);
  });

  it('should reset nested values to defaults', async () => {
    const { form } = await setup({ values: defaultValues });

    form.field.change('nested.deep.value', 'modified nested value');
    form.field.change('nested.deep.array', ['modified1', 'modified2']);

    expect(form.field.get('nested.deep.value')).toBe('modified nested value');
    expect(form.field.get('nested.deep.array')).toEqual(['modified1', 'modified2']);

    form.reset();

    expect(form.field.get('nested.deep.value')).toBe('default value');
    expect(form.field.get('nested.deep.array')).toEqual(['default1', 'default2']);
  });

  it('should reset to defaultValues regardless of initial values option', async () => {
    const partialValues = {
      name: 'Partial Name',
      email: 'partial@example.com',
      nested: {
        deep: {
          value: 'partial value',
          array: ['partial1'],
        },
      },
    };
    const form = new FormApi({
      schema,
      defaultValues,
      values: partialValues,
    });

    form['~mount']();

    expect(form.values).toEqual(partialValues);

    form.field.change('email', 'modified@example.com');

    form.reset();

    expect(form.values).toEqual(defaultValues);
  });
});

describe('resets field metadata', () => {
  it('should reset all field meta to defaults', async () => {
    const { form } = await setup({ values: defaultValues });

    form.field.change('name', 'New Name');
    form.field.focus('email');
    form.field.blur('email');

    expect(form.field.meta('name').dirty).toBe(true);
    expect(form.field.meta('name').touched).toBe(true);
    expect(form.field.meta('email').touched).toBe(true);
    expect(form.field.meta('email').blurred).toBe(true);

    form.reset();

    expect(form.field.meta('name').dirty).toBe(false);
    expect(form.field.meta('name').touched).toBe(false);
    expect(form.field.meta('email').touched).toBe(false);
    expect(form.field.meta('email').blurred).toBe(false);
  });

  it('should reset computed metadata properties', async () => {
    const { form } = await setup({ values: defaultValues });

    form.field.change('name', 'Modified Name');

    expect(form.field.meta('name').pristine).toBe(false);
    expect(form.field.meta('name').default).toBe(false);

    form.reset();

    expect(form.field.meta('name').pristine).toBe(true);
    expect(form.field.meta('name').default).toBe(true);
  });
});

describe('resets form status', () => {
  it('should reset form status to defaults', async () => {
    const { form } = await setup({ values: defaultValues });

    const onSuccess = () => {};
    await form.submit(onSuccess)();

    expect(form.status.submits).toBe(1);
    expect(form.status.submitted).toBe(true);
    expect(form.status.successful).toBe(true);
    expect(form.status.dirty).toBe(true);

    form.reset();

    expect(form.status.submits).toBe(0);
    expect(form.status.submitted).toBe(false);
    expect(form.status.successful).toBe(false);
    expect(form.status.dirty).toBe(false);
    expect(form.status.submitting).toBe(false);
    expect(form.status.validating).toBe(false);
    expect(form.status.valid).toBe(true);
  });
});

describe('clears errors', () => {
  it('should clear all field errors', async () => {
    const { form } = await setup({ values: { ...defaultValues, email: 'invalid-email' } });

    await form.validate();

    expect(form.field.errors('email')).not.toHaveLength(0);

    form.reset();

    expect(form.field.errors('email')).toHaveLength(0);
    expect(form.field.errors('name')).toHaveLength(0);
    expect(form.field.errors('nested.deep.value')).toHaveLength(0);
  });

  it('should clear errors after making invalid changes and then resetting', async () => {
    const { form } = await setup({ values: defaultValues });

    form.field.change('email', 'invalid-email');

    await form.validate();

    expect(form.field.errors('email')).not.toHaveLength(0);

    form.reset();

    expect(form.field.errors('email')).toHaveLength(0);
    expect(form.status.valid).toBe(true);
  });
});

describe('clears refs', () => {
  it('should clear all element references', async () => {
    const { form } = await setup({ values: defaultValues });

    const nameElement = document.createElement('input');
    const emailElement = document.createElement('input');

    form.field.register('name')(nameElement);
    form.field.register('email')(emailElement);

    expect(form.store.state.refs.name).toBe(nameElement);
    expect(form.store.state.refs.email).toBe(emailElement);

    form.reset();

    expect(form.store.state.refs.name).toBeUndefined();
    expect(form.store.state.refs.email).toBeUndefined();
    expect(Object.keys(form.store.state.refs)).toHaveLength(0);
  });
});

describe('integration scenarios', () => {
  it('should completely reset form after complex interactions', async () => {
    const { form } = await setup({ values: defaultValues });

    form.field.change('name', 'Modified Name');
    form.field.change('email', 'invalid-email');
    form.field.focus('nested.deep.value');
    form.field.change('nested.deep.value', 'modified nested');
    form.field.blur('nested.deep.value');

    const element = document.createElement('input');
    form.field.register('name')(element);

    const onSuccess = () => {};
    const onError = () => {};
    await form.submit(onSuccess, onError)();

    expect(form.values.name).toBe('Modified Name');
    expect(form.values.email).toBe('invalid-email');
    expect(form.field.meta('name').dirty).toBe(true);
    expect(form.field.meta('nested.deep.value').blurred).toBe(true);
    expect(form.field.errors('email')).not.toHaveLength(0);
    expect(form.status.submitted).toBe(true);
    expect(form.status.valid).toBe(false);
    expect(form.store.state.refs.name).toBe(element);

    form.reset();

    expect(form.values).toEqual(defaultValues);
    expect(form.field.meta('name').dirty).toBe(false);
    expect(form.field.meta('name').touched).toBe(false);
    expect(form.field.meta('nested.deep.value').blurred).toBe(false);
    expect(form.field.errors('email')).toHaveLength(0);
    expect(form.status.submits).toBe(0);
    expect(form.status.submitted).toBe(false);
    expect(form.status.dirty).toBe(false);
    expect(form.status.valid).toBe(true);
    expect(Object.keys(form.store.state.refs)).toHaveLength(0);
  });

  it('should allow normal form operations after reset', async () => {
    const { form } = await setup({ values: defaultValues });

    form.field.change('name', 'Modified');
    form.reset();

    form.field.change('name', 'New Name');
    expect(form.values.name).toBe('New Name');
    expect(form.field.meta('name').dirty).toBe(true);

    const onSuccess = () => {};
    await form.submit(onSuccess)();
    expect(form.status.successful).toBe(true);
  });
});

describe('reset with arguments', () => {
  describe('custom values', () => {
    it('should reset to custom values when provided', async () => {
      const { form } = await setup({ values: defaultValues });

      const customValues = {
        name: 'Custom Name',
        email: 'custom@example.com',
        nested: {
          deep: {
            value: 'custom value',
            array: ['custom1', 'custom2'],
          },
        },
      };

      form.field.change('name', 'Changed Name');
      form.field.change('email', 'changed@example.com');

      form.reset({ values: customValues });

      expect(form.values).toEqual(customValues);
    });

    it('should reset to custom values that replace defaultValues entirely', async () => {
      const { form } = await setup({ values: defaultValues });

      const customValues = {
        name: 'Custom Name',
        email: 'custom@example.com',
        nested: {
          deep: {
            value: 'custom nested value',
            array: ['custom1'],
          },
        },
      };

      form.field.change('name', 'Changed Name');

      form.reset({ values: customValues });

      expect(form.values.name).toBe('Custom Name');
      expect(form.values.email).toBe('custom@example.com');
      expect(form.values.nested.deep.value).toBe('custom nested value');
      expect(form.values.nested.deep.array).toEqual(['custom1']);
    });
  });

  describe('custom status', () => {
    it('should reset with custom status values', async () => {
      const { form } = await setup({ values: defaultValues });

      const onSuccess = () => {};
      await form.submit(onSuccess)();

      form.reset({
        status: {
          submits: 5,
          dirty: true,
          successful: true,
        },
      });

      expect(form.status.submits).toBe(5);
      expect(form.status.dirty).toBe(true);
      expect(form.status.successful).toBe(true);
      expect(form.status.submitting).toBe(false);
      expect(form.status.validating).toBe(false);
    });

    it('should merge custom status with defaults', async () => {
      const { form } = await setup({ values: defaultValues });

      form.reset({
        status: {
          submits: 3,
        },
      });

      expect(form.status.submits).toBe(3);
      expect(form.status.dirty).toBe(false);
      expect(form.status.submitting).toBe(false);
      expect(form.status.validating).toBe(false);
      expect(form.status.successful).toBe(false);
    });
  });

  describe('keep options', () => {
    it('should keep errors when keep.errors is true', async () => {
      const { form } = await setup({ values: defaultValues });

      form.field.change('email', 'invalid-email');
      await form.validate();

      expect(form.field.errors('email')).not.toHaveLength(0);

      form.reset({ keep: { errors: true } });

      expect(form.field.errors('email')).not.toHaveLength(0);
      expect(form.values).toEqual(defaultValues);
    });

    it('should keep refs when keep.refs is true', async () => {
      const { form } = await setup({ values: defaultValues });

      const nameElement = document.createElement('input');
      const emailElement = document.createElement('input');
      form.field.register('name')(nameElement);
      form.field.register('email')(emailElement);

      form.field.change('name', 'Changed Name');

      form.reset({ keep: { refs: true } });

      expect(form.store.state.refs.name).toBe(nameElement);
      expect(form.store.state.refs.email).toBe(emailElement);
      expect(form.values.name).toBe('Default Name');
    });

    it('should keep fields when keep.fields is true', async () => {
      const { form } = await setup({ values: defaultValues });

      form.field.change('name', 'New Name');
      form.field.focus('email');
      form.field.blur('email');

      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('email').touched).toBe(true);
      expect(form.field.meta('email').blurred).toBe(true);

      form.reset({ keep: { fields: true } });

      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('email').touched).toBe(true);
      expect(form.field.meta('email').blurred).toBe(true);
      expect(form.values.name).toBe('Default Name');
    });

    it('should keep multiple things when multiple keep options are true', async () => {
      const { form } = await setup({ values: defaultValues });

      form.field.change('name', 'Changed Name');
      form.field.change('email', 'invalid-email');
      await form.validate();

      const nameElement = document.createElement('input');
      form.field.register('name')(nameElement);

      form.reset({
        keep: {
          errors: true,
          refs: true,
        },
      });

      expect(form.field.errors('email')).not.toHaveLength(0);
      expect(form.store.state.refs.name).toBe(nameElement);
      expect(form.values.name).toBe('Default Name');
      expect(form.field.meta('name').dirty).toBe(false);
    });
  });

  describe('combined options', () => {
    it('should handle custom values, status, and keep options together', async () => {
      const { form } = await setup({ values: defaultValues });

      form.field.change('name', 'Changed Name');
      form.field.change('email', 'invalid-email');
      await form.validate();

      const element = document.createElement('input');
      form.field.register('name')(element);

      const onError = () => {};
      await form.submit(() => {}, onError)();

      const customValues = {
        name: 'Reset Name',
        email: 'reset@example.com',
        nested: {
          deep: {
            value: 'reset value',
            array: ['reset1'],
          },
        },
      };

      form.reset({
        values: customValues,
        status: { submits: 10 },
        keep: { refs: true },
      });

      expect(form.values).toEqual(customValues);
      expect(form.status.submits).toBe(10);
      expect(form.status.dirty).toBe(false);
      expect(form.store.state.refs.name).toBe(element);
      expect(form.field.errors('email')).toHaveLength(0);
      expect(form.field.meta('name').dirty).toBe(false);
    });

    it('should work with no options (same as original reset)', async () => {
      const { form } = await setup({ values: defaultValues });

      form.field.change('name', 'Changed Name');
      form.field.change('email', 'changed@example.com');

      const element = document.createElement('input');
      form.field.register('name')(element);

      form.reset();

      expect(form.values).toEqual(defaultValues);
      expect(form.status.submits).toBe(0);
      expect(form.status.dirty).toBe(false);
      expect(Object.keys(form.store.state.refs)).toHaveLength(0);
      expect(form.field.meta('name').dirty).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined values gracefully', async () => {
      const { form } = await setup({ values: defaultValues });

      form.reset({ values: undefined });

      expect(form.values).toEqual(defaultValues);
    });

    it('should handle empty keep object', async () => {
      const { form } = await setup({ values: defaultValues });

      form.field.change('name', 'Changed');

      form.reset({ keep: {} });

      expect(form.values.name).toBe('Default Name');
      expect(form.field.meta('name').dirty).toBe(false);
    });

    it('should handle keep options as false explicitly', async () => {
      const { form } = await setup({ values: defaultValues });

      form.field.change('email', 'invalid-email');
      await form.validate();

      form.reset({
        keep: {
          errors: false,
          refs: false,
          fields: false,
        },
      });

      expect(form.field.errors('email')).toHaveLength(0);
      expect(form.values).toEqual(defaultValues);
      expect(form.field.meta('email').dirty).toBe(false);
    });
  });
});
