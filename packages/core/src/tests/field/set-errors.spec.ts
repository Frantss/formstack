import { FormApi } from '#form-api';
import type { FormIssue } from '#form-api.types';
import { describe, expect, it } from 'vitest';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  email: z.string(),
  nested: z.object({
    value: z.string(),
  }),
});

const defaultValues = {
  name: 'John',
  email: 'john@example.com',
  nested: {
    value: 'test',
  },
};

const setup = () => {
  const form = new FormApi({
    schema,
    defaultValues,
  });

  form['~mount']();
  return { form };
};

const mockError: FormIssue = {
  code: 'custom',
  message: 'Custom error message',
  path: ['name'],
} as any;

const mockError2: FormIssue = {
  code: 'custom_2',
  message: 'Second custom error',
  path: ['name'],
} as any;

describe('replace mode (default)', () => {
  it('should set errors for a field with no existing errors', () => {
    const { form } = setup();

    form.field.setErrors('name', [mockError]);

    expect(form.field.errors('name')).toEqual([mockError]);
  });

  it('should replace existing errors by default', () => {
    const { form } = setup();

    form.field.setErrors('name', [mockError]);
    expect(form.field.errors('name')).toEqual([mockError]);

    form.field.setErrors('name', [mockError2]);
    expect(form.field.errors('name')).toEqual([mockError2]);
  });

  it('should replace existing errors when mode is explicitly set to replace', () => {
    const { form } = setup();

    form.field.setErrors('name', [mockError]);
    form.field.setErrors('name', [mockError2], { mode: 'replace' });

    expect(form.field.errors('name')).toEqual([mockError2]);
  });

  it('should clear errors when setting empty array', () => {
    const { form } = setup();

    form.field.setErrors('name', [mockError]);
    expect(form.field.errors('name')).toEqual([mockError]);

    form.field.setErrors('name', []);
    expect(form.field.errors('name')).toEqual([]);
  });
});

describe('append mode', () => {
  it('should append new errors to existing ones', () => {
    const { form } = setup();

    form.field.setErrors('name', [mockError]);
    form.field.setErrors('name', [mockError2], { mode: 'append' });

    expect(form.field.errors('name')).toEqual([mockError, mockError2]);
  });

  it('should append to empty error list', () => {
    const { form } = setup();

    form.field.setErrors('name', [mockError], { mode: 'append' });

    expect(form.field.errors('name')).toEqual([mockError]);
  });

  it('should append multiple errors at once', () => {
    const { form } = setup();

    const additionalError: FormIssue = {
      code: 'custom_3',
      message: 'Third custom error',
      path: ['name'],
    } as any;

    form.field.setErrors('name', [mockError]);
    form.field.setErrors('name', [mockError2, additionalError], { mode: 'append' });

    expect(form.field.errors('name')).toEqual([mockError, mockError2, additionalError]);
  });
});

describe('keep mode', () => {
  it('should keep existing errors when they exist', () => {
    const { form } = setup();

    form.field.setErrors('name', [mockError]);
    form.field.setErrors('name', [mockError2], { mode: 'keep' });

    expect(form.field.errors('name')).toEqual([mockError]);
  });

  it('should set new errors when no existing errors', () => {
    const { form } = setup();

    form.field.setErrors('name', [mockError], { mode: 'keep' });

    expect(form.field.errors('name')).toEqual([mockError]);
  });

  it('should not change errors when trying to set empty array with existing errors', () => {
    const { form } = setup();

    form.field.setErrors('name', [mockError]);
    form.field.setErrors('name', [], { mode: 'keep' });

    expect(form.field.errors('name')).toEqual([mockError]);
  });
});

describe('nested fields', () => {
  it('should set errors for nested fields', () => {
    const { form } = setup();

    const nestedError: FormIssue = {
      code: 'custom',
      message: 'Nested error',
      path: ['nested', 'value'],
    } as any;

    form.field.setErrors('nested.value', [nestedError]);

    expect(form.field.errors('nested.value')).toEqual([nestedError]);
  });

  it('should work with all modes for nested fields', () => {
    const { form } = setup();

    const nestedError1: FormIssue = {
      code: 'custom_1',
      message: 'First nested error',
      path: ['nested', 'value'],
    } as any;

    const nestedError2: FormIssue = {
      code: 'custom_2',
      message: 'Second nested error',
      path: ['nested', 'value'],
    } as any;

    form.field.setErrors('nested.value', [nestedError1]);
    form.field.setErrors('nested.value', [nestedError2], { mode: 'append' });
    expect(form.field.errors('nested.value')).toEqual([nestedError1, nestedError2]);

    form.field.setErrors('nested.value', [{ ...nestedError1, code: 'should_not_appear' } as any], { mode: 'keep' });
    expect(form.field.errors('nested.value')).toEqual([nestedError1, nestedError2]);

    form.field.setErrors('nested.value', [nestedError1], { mode: 'replace' });
    expect(form.field.errors('nested.value')).toEqual([nestedError1]);
  });
});

describe('multiple fields', () => {
  it('should not affect other fields when setting errors', () => {
    const { form } = setup();

    const nameError: FormIssue = {
      code: 'custom',
      message: 'Name error',
      path: ['name'],
    } as any;

    const emailError: FormIssue = {
      code: 'custom',
      message: 'Email error',
      path: ['email'],
    } as any;

    form.field.setErrors('name', [nameError]);
    form.field.setErrors('email', [emailError]);

    expect(form.field.errors('name')).toEqual([nameError]);
    expect(form.field.errors('email')).toEqual([emailError]);

    form.field.setErrors('name', []);
    expect(form.field.errors('name')).toEqual([]);
    expect(form.field.errors('email')).toEqual([emailError]);
  });
});

describe('form status updates', () => {
  it('should update form validity when errors are set', () => {
    const { form } = setup();

    expect(form.store.state.status.valid).toBe(true);

    form.field.setErrors('name', [mockError]);

    expect(form.store.state.status.valid).toBe(false);
  });

  it('should update form validity when errors are cleared', () => {
    const { form } = setup();

    form.field.setErrors('name', [mockError]);
    expect(form.store.state.status.valid).toBe(false);

    form.field.setErrors('name', []);
    expect(form.store.state.status.valid).toBe(true);
  });

  it('should maintain field meta state when setting errors manually', () => {
    const { form } = setup();

    form.field.change('name', 'Jane');
    form.field.focus('name');
    form.field.blur('name');

    const metaBefore = form.field.meta('name');

    form.field.setErrors('name', [mockError]);

    const metaAfter = form.field.meta('name');

    expect(metaAfter.dirty).toBe(metaBefore.dirty);
    expect(metaAfter.touched).toBe(metaBefore.touched);
    expect(metaAfter.blurred).toBe(metaBefore.blurred);
    expect(metaAfter.valid).toBe(false); // This should change due to error
  });
});
