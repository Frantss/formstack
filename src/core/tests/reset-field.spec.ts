import { FormApi } from '#/core/form-api';
import { describe, expect, it } from 'vitest';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  email: z.string().email('Invalid email format'),
  age: z.number().min(0, 'Age must be non-negative'),
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
  age: 25,
  nested: {
    deep: {
      value: 'default value',
      array: ['default1', 'default2'],
    },
  },
};

const setup = async () => {
  const form = new FormApi({
    schema,
    defaultValues,
  });

  form['~mount']();

  return { form };
};

describe('basic field reset', () => {
  it('should reset field value to default', async () => {
    const { form } = await setup();

    form.change('name', 'Changed Name');

    expect(form.get('name')).toBe('Changed Name');

    form.resetField('name');

    expect(form.get('name')).toBe('Default Name');
  });

  it('should reset nested field value to default', async () => {
    const { form } = await setup();

    form.change('nested.deep.value', 'changed nested');

    expect(form.get('nested.deep.value')).toBe('changed nested');

    form.resetField('nested.deep.value');

    expect(form.get('nested.deep.value')).toBe('default value');
  });

  it('should reset array field value to default', async () => {
    const { form } = await setup();

    form.change('nested.deep.array', ['changed1', 'changed2', 'changed3']);

    expect(form.get('nested.deep.array')).toEqual(['changed1', 'changed2', 'changed3']);

    form.resetField('nested.deep.array');

    expect(form.get('nested.deep.array')).toEqual(['default1', 'default2']);
  });

  it('should not affect other fields when resetting single field', async () => {
    const { form } = await setup();

    form.change('name', 'Changed Name');
    form.change('email', 'changed@example.com');
    form.change('age', 30);

    form.resetField('name');

    expect(form.get('name')).toBe('Default Name');
    expect(form.get('email')).toBe('changed@example.com');
    expect(form.get('age')).toBe(30);
  });
});

describe('field metadata reset', () => {
  it('should reset field metadata to defaults', async () => {
    const { form } = await setup();

    form.change('name', 'Changed Name');
    form.focus('name');
    form.blur('name');

    expect(form.meta('name').dirty).toBe(true);
    expect(form.meta('name').touched).toBe(true);
    expect(form.meta('name').blurred).toBe(true);

    form.resetField('name');

    expect(form.meta('name').dirty).toBe(false);
    expect(form.meta('name').touched).toBe(false);
    expect(form.meta('name').blurred).toBe(false);
  });

  it('should reset computed metadata properties', async () => {
    const { form } = await setup();

    form.change('name', 'Changed Name');

    expect(form.meta('name').pristine).toBe(false);
    expect(form.meta('name').default).toBe(false);

    form.resetField('name');

    expect(form.meta('name').pristine).toBe(true);
    expect(form.meta('name').default).toBe(true);
  });

  it('should not affect metadata of other fields', async () => {
    const { form } = await setup();

    form.change('name', 'Changed Name');
    form.change('email', 'changed@example.com');
    form.focus('email');

    form.resetField('name');

    expect(form.meta('name').dirty).toBe(false);
    expect(form.meta('email').dirty).toBe(true);
    expect(form.meta('email').touched).toBe(true);
  });
});

describe('field errors reset', () => {
  it('should clear field errors', async () => {
    const { form } = await setup();

    form.change('email', 'invalid-email');
    await form.validate();

    expect(form.errors('email')).not.toHaveLength(0);

    form.resetField('email');

    expect(form.errors('email')).toHaveLength(0);
  });

  it('should not affect errors of other fields', async () => {
    const { form } = await setup();

    form.change('email', 'invalid-email');
    form.change('age', -5);
    await form.validate();

    expect(form.errors('email')).not.toHaveLength(0);
    expect(form.errors('age')).not.toHaveLength(0);

    form.resetField('email');

    expect(form.errors('email')).toHaveLength(0);
    expect(form.errors('age')).not.toHaveLength(0);
  });
});

describe('field refs reset', () => {
  it('should clear field ref', async () => {
    const { form } = await setup();

    const nameElement = document.createElement('input');
    const emailElement = document.createElement('input');

    form.register('name')(nameElement);
    form.register('email')(emailElement);

    expect(form.store.state.refs.name).toBe(nameElement);
    expect(form.store.state.refs.email).toBe(emailElement);

    form.resetField('name');

    expect(form.store.state.refs.name).toBeUndefined();
    expect(form.store.state.refs.email).toBe(emailElement);
  });
});

describe('resetField with options', () => {
  describe('custom value option', () => {
    it('should reset field to custom value instead of default', async () => {
      const { form } = await setup();

      form.change('name', 'Changed Name');

      form.resetField('name', { value: 'Custom Reset Value' });

      expect(form.get('name')).toBe('Custom Reset Value');
    });

    it('should reset nested field to custom value', async () => {
      const { form } = await setup();

      form.change('nested.deep.value', 'changed');

      form.resetField('nested.deep.value', { value: 'custom nested' });

      expect(form.get('nested.deep.value')).toBe('custom nested');
    });

    it('should reset array field to custom value', async () => {
      const { form } = await setup();

      form.change('nested.deep.array', ['changed']);

      form.resetField('nested.deep.array', { value: ['custom1', 'custom2'] });

      expect(form.get('nested.deep.array')).toEqual(['custom1', 'custom2']);
    });
  });

  describe('keep options', () => {
    it('should keep field metadata when keep.meta is true', async () => {
      const { form } = await setup();

      form.change('name', 'Changed Name');
      form.focus('name');
      form.blur('name');

      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.meta('name').blurred).toBe(true);

      form.resetField('name', { keep: { meta: true } });

      expect(form.get('name')).toBe('Default Name');
      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.meta('name').blurred).toBe(true);
    });

    it('should keep field errors when keep.errors is true', async () => {
      const { form } = await setup();

      form.change('email', 'invalid-email');
      await form.validate();

      expect(form.errors('email')).not.toHaveLength(0);

      form.resetField('email', { keep: { errors: true } });

      expect(form.get('email')).toBe('default@example.com');
      expect(form.errors('email')).not.toHaveLength(0);
    });

    it('should keep field refs when keep.refs is true', async () => {
      const { form } = await setup();

      const nameElement = document.createElement('input');
      form.register('name')(nameElement);

      form.change('name', 'Changed Name');

      form.resetField('name', { keep: { refs: true } });

      expect(form.get('name')).toBe('Default Name');
      expect(form.store.state.refs.name).toBe(nameElement);
    });

    it('should keep multiple things when multiple keep options are true', async () => {
      const { form } = await setup();

      const nameElement = document.createElement('input');
      form.register('name')(nameElement);

      form.change('name', 'invalid-name-that-would-cause-error');
      form.focus('name');
      form.blur('name');

      const mockErrors = [{ code: 'test', message: 'Test error', path: ['name'] }];
      form['persisted'].setState(current => ({
        ...current,
        errors: { ...current.errors, name: mockErrors },
      }));

      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.errors('name')).toEqual(mockErrors);
      expect(form.store.state.refs.name).toBe(nameElement);

      form.resetField('name', {
        keep: {
          meta: true,
          errors: true,
          refs: true,
        },
      });

      expect(form.get('name')).toBe('Default Name');
      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.errors('name')).toEqual(mockErrors);
      expect(form.store.state.refs.name).toBe(nameElement);
    });
  });

  describe('combined options', () => {
    it('should handle custom value and keep options together', async () => {
      const { form } = await setup();

      form.change('name', 'Changed Name');
      form.focus('name');

      form.resetField('name', {
        value: 'Custom Reset Value',
        keep: { meta: true },
      });

      expect(form.get('name')).toBe('Custom Reset Value');
      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
    });
  });

  describe('meta overrides', () => {
    it('should set specific meta values when provided', async () => {
      const { form } = await setup();

      form.change('name', 'Changed Name');

      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.meta('name').blurred).toBe(false);

      form.resetField('name', {
        meta: {
          dirty: false,
          touched: false,
          blurred: true,
        },
      });

      expect(form.get('name')).toBe('Default Name');
      expect(form.meta('name').dirty).toBe(false);
      expect(form.meta('name').touched).toBe(false);
      expect(form.meta('name').blurred).toBe(true);
    });

    it('should partially override meta values if keep.meta is true', async () => {
      const { form } = await setup();

      form.change('name', 'Changed Name');
      form.focus('name');
      form.blur('name');

      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.meta('name').blurred).toBe(true);

      form.resetField('name', {
        meta: {
          dirty: false,
        },
        keep: {
          meta: true,
        },
      });

      expect(form.get('name')).toBe('Default Name');
      expect(form.meta('name').dirty).toBe(false);
      expect(form.meta('name').touched).toBe(true);
      expect(form.meta('name').blurred).toBe(true);
    });

    it('should fully override meta values if keep.meta is undefined', async () => {
      const { form } = await setup();

      form.change('name', 'Changed Name');
      form.focus('name');
      form.blur('name');

      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.meta('name').blurred).toBe(true);

      form.resetField('name', {
        meta: {
          blurred: true,
        },
      });

      expect(form.get('name')).toBe('Default Name');
      expect(form.meta('name').dirty).toBe(false);
      expect(form.meta('name').touched).toBe(false);
      expect(form.meta('name').blurred).toBe(true);
    });

    it('should work with custom value and meta overrides', async () => {
      const { form } = await setup();

      form.resetField('name', {
        value: 'Custom Value',
        meta: {
          dirty: true,
          touched: true,
          blurred: false,
        },
      });

      expect(form.get('name')).toBe('Custom Value');
      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.meta('name').blurred).toBe(false);
    });

    it('should work with keep.meta true and meta overrides', async () => {
      const { form } = await setup();

      form.change('name', 'Changed Name');
      form.focus('name');
      form.blur('name');

      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.meta('name').blurred).toBe(true);

      form.resetField('name', {
        keep: { meta: true },
        meta: {
          blurred: false,
        },
      });

      expect(form.get('name')).toBe('Default Name');
      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.meta('name').blurred).toBe(false);
    });

    it('should create meta when field has no existing meta', async () => {
      const { form } = await setup();

      expect(form.meta('name').dirty).toBe(false);
      expect(form.meta('name').touched).toBe(false);
      expect(form.meta('name').blurred).toBe(false);

      form.resetField('name', {
        meta: {
          dirty: true,
          touched: true,
          blurred: true,
        },
      });

      expect(form.get('name')).toBe('Default Name');
      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.meta('name').blurred).toBe(true);
    });

    it('should handle meta overrides with nested fields', async () => {
      const { form } = await setup();

      form.change('nested.deep.value', 'changed value');
      form.focus('nested.deep.value');

      expect(form.meta('nested.deep.value').dirty).toBe(true);
      expect(form.meta('nested.deep.value').touched).toBe(true);
      expect(form.meta('nested.deep.value').blurred).toBe(false);

      form.resetField('nested.deep.value', {
        meta: {
          dirty: false,
          blurred: true,
        },
      });

      expect(form.get('nested.deep.value')).toBe('default value');
      expect(form.meta('nested.deep.value').dirty).toBe(false);
      expect(form.meta('nested.deep.value').touched).toBe(false);
      expect(form.meta('nested.deep.value').blurred).toBe(true);
    });

    it('should handle meta overrides with all options combined', async () => {
      const { form } = await setup();

      const nameElement = document.createElement('input');
      form.register('name')(nameElement);

      form.change('name', 'invalid-name');

      const mockErrors = [{ code: 'test', message: 'Test error', path: ['name'] }];
      form['persisted'].setState(current => ({
        ...current,
        errors: { ...current.errors, name: mockErrors },
      }));

      form.resetField('name', {
        value: 'Custom Reset Value',
        meta: {
          dirty: true,
          touched: true,
          blurred: false,
        },
        keep: {
          errors: true,
          refs: true,
        },
      });

      expect(form.get('name')).toBe('Custom Reset Value');
      expect(form.meta('name').dirty).toBe(true);
      expect(form.meta('name').touched).toBe(true);
      expect(form.meta('name').blurred).toBe(false);
      expect(form.errors('name')).toEqual(mockErrors);
      expect(form.store.state.refs.name).toBe(nameElement);
    });
  });
});

describe('edge cases', () => {
  it('should handle resetting non-existent field gracefully', async () => {
    const { form } = await setup();

    expect(() => {
      form.resetField('nonExistent' as any);
    }).not.toThrow();
  });

  it('should handle undefined custom value gracefully', async () => {
    const { form } = await setup();

    form.change('name', 'Changed Name');

    form.resetField('name', { value: undefined });

    expect(form.get('name')).toBe('Default Name');
  });

  it('should work after form reset', async () => {
    const { form } = await setup();

    form.change('name', 'Changed Name');
    form.change('email', 'changed@example.com');

    form.reset();

    expect(form.get('name')).toBe('Default Name');
    expect(form.get('email')).toBe('default@example.com');

    form.change('name', 'New Change');

    form.resetField('name');

    expect(form.get('name')).toBe('Default Name');
    expect(form.get('email')).toBe('default@example.com');
  });

  it('should not affect form-level status', async () => {
    const { form } = await setup();

    const onSuccess = () => {};
    await form.submit(onSuccess)();

    expect(form.status.submits).toBe(1);
    expect(form.status.submitted).toBe(true);

    form.change('name', 'Changed Name');
    form.resetField('name');

    expect(form.status.submits).toBe(1);
    expect(form.status.submitted).toBe(true);
  });
});

describe('integration with other form methods', () => {
  it('should work correctly with validation', async () => {
    const { form } = await setup();

    form.change('email', 'invalid-email');
    await form.validate();

    expect(form.errors('email')).not.toHaveLength(0);
    expect(form.status.valid).toBe(false);

    form.resetField('email');

    expect(form.errors('email')).toHaveLength(0);
    await form.validate();
    expect(form.status.valid).toBe(true);
  });

  it('should work correctly after field interactions', async () => {
    const { form } = await setup();

    form.change('name', 'Changed Name');
    form.focus('name');
    form.blur('name');

    const nameElement = document.createElement('input');
    form.register('name')(nameElement);

    expect(form.get('name')).toBe('Changed Name');
    expect(form.meta('name').dirty).toBe(true);
    expect(form.meta('name').touched).toBe(true);
    expect(form.meta('name').blurred).toBe(true);
    expect(form.store.state.refs.name).toBe(nameElement);

    form.resetField('name');

    expect(form.get('name')).toBe('Default Name');
    expect(form.meta('name').dirty).toBe(false);
    expect(form.meta('name').touched).toBe(false);
    expect(form.meta('name').blurred).toBe(false);
    expect(form.store.state.refs.name).toBeUndefined();

    form.change('name', 'New Value After Reset');
    expect(form.get('name')).toBe('New Value After Reset');
    expect(form.meta('name').dirty).toBe(true);
  });
});
