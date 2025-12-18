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

    form.field.change('name', 'Changed Name');

    expect(form.field.get('name')).toBe('Changed Name');

    form.field.reset('name');

    expect(form.field.get('name')).toBe('Default Name');
  });

  it('should reset nested field value to default', async () => {
    const { form } = await setup();

    form.field.change('nested.deep.value', 'changed nested');

    expect(form.field.get('nested.deep.value')).toBe('changed nested');

    form.field.reset('nested.deep.value');

    expect(form.field.get('nested.deep.value')).toBe('default value');
  });

  it('should reset array field value to default', async () => {
    const { form } = await setup();

    form.field.change('nested.deep.array', ['changed1', 'changed2', 'changed3']);

    expect(form.field.get('nested.deep.array')).toEqual(['changed1', 'changed2', 'changed3']);

    form.field.reset('nested.deep.array');

    expect(form.field.get('nested.deep.array')).toEqual(['default1', 'default2']);
  });

  it('should not affect other fields when resetting single field', async () => {
    const { form } = await setup();

    form.field.change('name', 'Changed Name');
    form.field.change('email', 'changed@example.com');
    form.field.change('age', 30);

    form.field.reset('name');

    expect(form.field.get('name')).toBe('Default Name');
    expect(form.field.get('email')).toBe('changed@example.com');
    expect(form.field.get('age')).toBe(30);
  });
});

describe('field metadata reset', () => {
  it('should reset field metadata to defaults', async () => {
    const { form } = await setup();

    form.field.change('name', 'Changed Name');
    form.field.focus('name');
    form.field.blur('name');

    expect(form.field.meta('name').dirty).toBe(true);
    expect(form.field.meta('name').touched).toBe(true);
    expect(form.field.meta('name').blurred).toBe(true);

    form.field.reset('name');

    expect(form.field.meta('name').dirty).toBe(false);
    expect(form.field.meta('name').touched).toBe(false);
    expect(form.field.meta('name').blurred).toBe(false);
  });

  it('should reset computed metadata properties', async () => {
    const { form } = await setup();

    form.field.change('name', 'Changed Name');

    expect(form.field.meta('name').pristine).toBe(false);
    expect(form.field.meta('name').default).toBe(false);

    form.field.reset('name');

    expect(form.field.meta('name').pristine).toBe(true);
    expect(form.field.meta('name').default).toBe(true);
  });

  it('should not affect metadata of other fields', async () => {
    const { form } = await setup();

    form.field.change('name', 'Changed Name');
    form.field.change('email', 'changed@example.com');
    form.field.focus('email');

    form.field.reset('name');

    expect(form.field.meta('name').dirty).toBe(false);
    expect(form.field.meta('email').dirty).toBe(true);
    expect(form.field.meta('email').touched).toBe(true);
  });
});

describe('field errors reset', () => {
  it('should clear field errors', async () => {
    const { form } = await setup();

    form.field.change('email', 'invalid-email');
    await form.validate();

    expect(form.field.errors('email')).not.toHaveLength(0);

    form.field.reset('email');

    expect(form.field.errors('email')).toHaveLength(0);
  });

  it('should not affect errors of other fields', async () => {
    const { form } = await setup();

    form.field.change('email', 'invalid-email');
    form.field.change('age', -5);
    await form.validate();

    expect(form.field.errors('email')).not.toHaveLength(0);
    expect(form.field.errors('age')).not.toHaveLength(0);

    form.field.reset('email');

    expect(form.field.errors('email')).toHaveLength(0);
    expect(form.field.errors('age')).not.toHaveLength(0);
  });
});

describe('field refs reset', () => {
  it('should clear field ref', async () => {
    const { form } = await setup();

    const nameElement = document.createElement('input');
    const emailElement = document.createElement('input');

    form.field.register('name')(nameElement);
    form.field.register('email')(emailElement);

    expect(form.store.state.refs.name).toBe(nameElement);
    expect(form.store.state.refs.email).toBe(emailElement);

    form.field.reset('name');

    expect(form.store.state.refs.name).toBeUndefined();
    expect(form.store.state.refs.email).toBe(emailElement);
  });
});

describe('reset with options', () => {
  describe('custom value option', () => {
    it('should reset field to custom value instead of default', async () => {
      const { form } = await setup();

      form.field.change('name', 'Changed Name');

      form.field.reset('name', { value: 'Custom Reset Value' });

      expect(form.field.get('name')).toBe('Custom Reset Value');
    });

    it('should reset nested field to custom value', async () => {
      const { form } = await setup();

      form.field.change('nested.deep.value', 'changed');

      form.field.reset('nested.deep.value', { value: 'custom nested' });

      expect(form.field.get('nested.deep.value')).toBe('custom nested');
    });

    it('should reset array field to custom value', async () => {
      const { form } = await setup();

      form.field.change('nested.deep.array', ['changed']);

      form.field.reset('nested.deep.array', { value: ['custom1', 'custom2'] });

      expect(form.field.get('nested.deep.array')).toEqual(['custom1', 'custom2']);
    });
  });

  describe('keep options', () => {
    it('should keep field metadata when keep.meta is true', async () => {
      const { form } = await setup();

      form.field.change('name', 'Changed Name');
      form.field.focus('name');
      form.field.blur('name');

      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('name').blurred).toBe(true);

      form.field.reset('name', { keep: { meta: true } });

      expect(form.field.get('name')).toBe('Default Name');
      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('name').blurred).toBe(true);
    });

    it('should keep field errors when keep.errors is true', async () => {
      const { form } = await setup();

      form.field.change('email', 'invalid-email');
      await form.validate();

      expect(form.field.errors('email')).not.toHaveLength(0);

      form.field.reset('email', { keep: { errors: true } });

      expect(form.field.get('email')).toBe('default@example.com');
      expect(form.field.errors('email')).not.toHaveLength(0);
    });

    it('should keep field refs when keep.refs is true', async () => {
      const { form } = await setup();

      const nameElement = document.createElement('input');
      form.field.register('name')(nameElement);

      form.field.change('name', 'Changed Name');

      form.field.reset('name', { keep: { refs: true } });

      expect(form.field.get('name')).toBe('Default Name');
      expect(form.store.state.refs.name).toBe(nameElement);
    });

    it('should keep multiple things when multiple keep options are true', async () => {
      const { form } = await setup();

      const nameElement = document.createElement('input');
      form.field.register('name')(nameElement);

      form.field.change('name', 'invalid-name-that-would-cause-error');
      form.field.focus('name');
      form.field.blur('name');

      const mockErrors = [{ code: 'test', message: 'Test error', path: ['name'] }];
      form.field.setErrors('name', mockErrors);

      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.errors('name')).toEqual(mockErrors);
      expect(form.store.state.refs.name).toBe(nameElement);

      form.field.reset('name', {
        keep: {
          meta: true,
          errors: true,
          refs: true,
        },
      });

      expect(form.field.get('name')).toBe('Default Name');
      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.errors('name')).toEqual(mockErrors);
      expect(form.store.state.refs.name).toBe(nameElement);
    });
  });

  describe('combined options', () => {
    it('should handle custom value and keep options together', async () => {
      const { form } = await setup();

      form.field.change('name', 'Changed Name');
      form.field.focus('name');

      form.field.reset('name', {
        value: 'Custom Reset Value',
        keep: { meta: true },
      });

      expect(form.field.get('name')).toBe('Custom Reset Value');
      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
    });
  });

  describe('meta overrides', () => {
    it('should set specific meta values when provided', async () => {
      const { form } = await setup();

      form.field.change('name', 'Changed Name');

      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('name').blurred).toBe(false);

      form.field.reset('name', {
        meta: {
          dirty: false,
          touched: false,
          blurred: true,
        },
      });

      expect(form.field.get('name')).toBe('Default Name');
      expect(form.field.meta('name').dirty).toBe(false);
      expect(form.field.meta('name').touched).toBe(false);
      expect(form.field.meta('name').blurred).toBe(true);
    });

    it('should partially override meta values if keep.meta is true', async () => {
      const { form } = await setup();

      form.field.change('name', 'Changed Name');
      form.field.focus('name');
      form.field.blur('name');

      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('name').blurred).toBe(true);

      form.field.reset('name', {
        meta: {
          dirty: false,
        },
        keep: {
          meta: true,
        },
      });

      expect(form.field.get('name')).toBe('Default Name');
      expect(form.field.meta('name').dirty).toBe(false);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('name').blurred).toBe(true);
    });

    it('should fully override meta values if keep.meta is undefined', async () => {
      const { form } = await setup();

      form.field.change('name', 'Changed Name');
      form.field.focus('name');
      form.field.blur('name');

      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('name').blurred).toBe(true);

      form.field.reset('name', {
        meta: {
          blurred: true,
        },
      });

      expect(form.field.get('name')).toBe('Default Name');
      expect(form.field.meta('name').dirty).toBe(false);
      expect(form.field.meta('name').touched).toBe(false);
      expect(form.field.meta('name').blurred).toBe(true);
    });

    it('should work with custom value and meta overrides', async () => {
      const { form } = await setup();

      form.field.reset('name', {
        value: 'Custom Value',
        meta: {
          dirty: true,
          touched: true,
          blurred: false,
        },
      });

      expect(form.field.get('name')).toBe('Custom Value');
      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('name').blurred).toBe(false);
    });

    it('should work with keep.meta true and meta overrides', async () => {
      const { form } = await setup();

      form.field.change('name', 'Changed Name');
      form.field.focus('name');
      form.field.blur('name');

      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('name').blurred).toBe(true);

      form.field.reset('name', {
        keep: { meta: true },
        meta: {
          blurred: false,
        },
      });

      expect(form.field.get('name')).toBe('Default Name');
      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('name').blurred).toBe(false);
    });

    it('should create meta when field has no existing meta', async () => {
      const { form } = await setup();

      expect(form.field.meta('name').dirty).toBe(false);
      expect(form.field.meta('name').touched).toBe(false);
      expect(form.field.meta('name').blurred).toBe(false);

      form.field.reset('name', {
        meta: {
          dirty: true,
          touched: true,
          blurred: true,
        },
      });

      expect(form.field.get('name')).toBe('Default Name');
      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('name').blurred).toBe(true);
    });

    it('should handle meta overrides with nested fields', async () => {
      const { form } = await setup();

      form.field.change('nested.deep.value', 'changed value');
      form.field.focus('nested.deep.value');

      expect(form.field.meta('nested.deep.value').dirty).toBe(true);
      expect(form.field.meta('nested.deep.value').touched).toBe(true);
      expect(form.field.meta('nested.deep.value').blurred).toBe(false);

      form.field.reset('nested.deep.value', {
        meta: {
          dirty: false,
          blurred: true,
        },
      });

      expect(form.field.get('nested.deep.value')).toBe('default value');
      expect(form.field.meta('nested.deep.value').dirty).toBe(false);
      expect(form.field.meta('nested.deep.value').touched).toBe(false);
      expect(form.field.meta('nested.deep.value').blurred).toBe(true);
    });

    it('should handle meta overrides with all options combined', async () => {
      const { form } = await setup();

      const nameElement = document.createElement('input');
      form.field.register('name')(nameElement);

      form.field.change('name', 'invalid-name');

      const mockErrors = [{ code: 'test', message: 'Test error', path: ['name'] }];
      form.field.setErrors('name', mockErrors);

      form.field.reset('name', {
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

      expect(form.field.get('name')).toBe('Custom Reset Value');
      expect(form.field.meta('name').dirty).toBe(true);
      expect(form.field.meta('name').touched).toBe(true);
      expect(form.field.meta('name').blurred).toBe(false);
      expect(form.field.errors('name')).toEqual(mockErrors);
      expect(form.store.state.refs.name).toBe(nameElement);
    });
  });
});

describe('edge cases', () => {
  it('should handle resetting non-existent field gracefully', async () => {
    const { form } = await setup();

    expect(() => {
      form.field.reset('nonExistent' as any);
    }).not.toThrow();
  });

  it('should handle undefined custom value gracefully', async () => {
    const { form } = await setup();

    form.field.change('name', 'Changed Name');

    form.field.reset('name', { value: undefined });

    expect(form.field.get('name')).toBe('Default Name');
  });

  it('should work after form reset', async () => {
    const { form } = await setup();

    form.field.change('name', 'Changed Name');
    form.field.change('email', 'changed@example.com');

    form.reset();

    expect(form.field.get('name')).toBe('Default Name');
    expect(form.field.get('email')).toBe('default@example.com');

    form.field.change('name', 'New Change');

    form.field.reset('name');

    expect(form.field.get('name')).toBe('Default Name');
    expect(form.field.get('email')).toBe('default@example.com');
  });

  it('should not affect form-level status', async () => {
    const { form } = await setup();

    const onSuccess = () => {};
    await form.submit(onSuccess)();

    expect(form.status.submits).toBe(1);
    expect(form.status.submitted).toBe(true);

    form.field.change('name', 'Changed Name');
    form.field.reset('name');

    expect(form.status.submits).toBe(1);
    expect(form.status.submitted).toBe(true);
  });
});

describe('integration with other form methods', () => {
  it('should work correctly with validation', async () => {
    const { form } = await setup();

    form.field.change('email', 'invalid-email');
    await form.validate();

    expect(form.field.errors('email')).not.toHaveLength(0);
    expect(form.status.valid).toBe(false);

    form.field.reset('email');

    expect(form.field.errors('email')).toHaveLength(0);
    await form.validate();
    expect(form.status.valid).toBe(true);
  });

  it('should work correctly after field interactions', async () => {
    const { form } = await setup();

    form.field.change('name', 'Changed Name');
    form.field.focus('name');
    form.field.blur('name');

    const nameElement = document.createElement('input');
    form.field.register('name')(nameElement);

    expect(form.field.get('name')).toBe('Changed Name');
    expect(form.field.meta('name').dirty).toBe(true);
    expect(form.field.meta('name').touched).toBe(true);
    expect(form.field.meta('name').blurred).toBe(true);
    expect(form.store.state.refs.name).toBe(nameElement);

    form.field.reset('name');

    expect(form.field.get('name')).toBe('Default Name');
    expect(form.field.meta('name').dirty).toBe(false);
    expect(form.field.meta('name').touched).toBe(false);
    expect(form.field.meta('name').blurred).toBe(false);
    expect(form.store.state.refs.name).toBeUndefined();

    form.field.change('name', 'New Value After Reset');
    expect(form.field.get('name')).toBe('New Value After Reset');
    expect(form.field.meta('name').dirty).toBe(true);
  });
});
