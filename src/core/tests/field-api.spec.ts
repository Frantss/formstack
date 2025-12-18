import { FieldApi } from '#/core/field-api';
import { FormApi } from '#/core/form-api';
import type { FormIssue } from '#/core/form-api.types';
import { describe, expect, it } from 'vitest';
import z from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string(),
  nested: z.object({
    value: z.string().min(1, 'Value is required'),
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

  const nameField = new FieldApi({ form, name: 'name' });
  nameField['~mount']();

  const emailField = new FieldApi({ form, name: 'email' });
  emailField['~mount']();

  const nestedField = new FieldApi({ form, name: 'nested.value' });
  nestedField['~mount']();

  return { form, nameField, emailField, nestedField };
};

describe('FieldApi methods', () => {
  describe('validate method', () => {
    it('should validate the specific field only', async () => {
      const { nameField, form } = setup();

      // Make the name field invalid
      nameField.change('');

      // Validate only the name field
      const issues = await nameField.validate({ type: 'submit' });

      expect(issues).toHaveLength(1);
      expect(issues[0].path).toEqual(['name']);
      expect(form.field.errors('name')).toHaveLength(1);
      expect(form.field.errors('email')).toHaveLength(0);
    });

    it('should validate field with different validation types', async () => {
      const { nameField } = setup();

      // Test different validation types
      await nameField.validate({ type: 'blur' });
      await nameField.validate({ type: 'focus' });
      await nameField.validate({ type: 'submit' });
      await nameField.validate({ type: 'change' });

      // Should not throw and should work with all types
      expect(nameField.errors).toEqual([]);
    });

    it('should validate field without options (using default schema)', async () => {
      const { nameField } = setup();

      nameField.change(''); // Make invalid
      const issues = await nameField.validate();

      expect(issues).toHaveLength(1);
      expect(issues[0].path).toEqual(['name']);
    });
  });

  describe('setErrors method', () => {
    const mockError: FormIssue = {
      code: 'custom',
      message: 'Custom field error',
      path: ['name'],
    } as any;

    const mockError2: FormIssue = {
      code: 'custom_2',
      message: 'Second field error',
      path: ['name'],
    } as any;

    it('should set errors in replace mode by default', () => {
      const { nameField } = setup();

      nameField.setErrors([mockError]);
      expect(nameField.errors).toEqual([mockError]);

      // Replace with new error
      nameField.setErrors([mockError2]);
      expect(nameField.errors).toEqual([mockError2]);
    });

    it('should set errors in append mode', () => {
      const { nameField } = setup();

      nameField.setErrors([mockError]);
      nameField.setErrors([mockError2], { mode: 'append' });

      expect(nameField.errors).toEqual([mockError, mockError2]);
    });

    it('should set errors in keep mode', () => {
      const { nameField } = setup();

      // Set initial error
      nameField.setErrors([mockError]);

      // Try to set new error with keep mode - should keep existing
      nameField.setErrors([mockError2], { mode: 'keep' });
      expect(nameField.errors).toEqual([mockError]);
    });

    it('should set errors in keep mode when no existing errors', () => {
      const { nameField } = setup();

      nameField.setErrors([mockError], { mode: 'keep' });
      expect(nameField.errors).toEqual([mockError]);
    });

    it('should clear errors when setting empty array', () => {
      const { nameField } = setup();

      nameField.setErrors([mockError]);
      expect(nameField.errors).toEqual([mockError]);

      nameField.setErrors([]);
      expect(nameField.errors).toEqual([]);
    });

    it('should work with nested fields', () => {
      const { nestedField } = setup();

      const nestedError: FormIssue = {
        code: 'custom',
        message: 'Nested field error',
        path: ['nested', 'value'],
      } as any;

      nestedField.setErrors([nestedError]);
      expect(nestedField.errors).toEqual([nestedError]);
    });
  });

  describe('reset method', () => {
    it('should reset field to default value', () => {
      const { nameField } = setup();

      // Change the field value
      nameField.change('Jane');
      expect(nameField.value).toBe('Jane');

      // Reset the field
      nameField.reset();
      expect(nameField.value).toBe('John'); // back to default
    });

    it('should reset field to specific value', () => {
      const { nameField } = setup();

      nameField.change('Jane');
      nameField.reset({ value: 'Bob' });

      expect(nameField.value).toBe('Bob');
    });

    it('should reset field meta by default', () => {
      const { nameField } = setup();

      // Make the field dirty and touched
      nameField.change('Jane');
      nameField.focus();
      nameField.blur();

      expect(nameField.meta.dirty).toBe(true);
      expect(nameField.meta.touched).toBe(true);
      expect(nameField.meta.blurred).toBe(true);

      // Reset the field
      nameField.reset();

      expect(nameField.meta.dirty).toBe(false);
      expect(nameField.meta.touched).toBe(false);
      expect(nameField.meta.blurred).toBe(false);
    });

    it('should keep field meta when specified', () => {
      const { nameField } = setup();

      // Make the field dirty and touched
      nameField.change('Jane');
      nameField.focus();
      nameField.blur();

      const metaBefore = { ...nameField.meta };

      // Reset but keep meta
      nameField.reset({ keep: { meta: true } });

      expect(nameField.value).toBe('John'); // value should reset
      expect(nameField.meta.dirty).toBe(metaBefore.dirty);
      expect(nameField.meta.touched).toBe(metaBefore.touched);
      expect(nameField.meta.blurred).toBe(metaBefore.blurred);
    });

    it('should reset field errors by default', () => {
      const { nameField } = setup();

      const mockError: FormIssue = {
        code: 'custom',
        message: 'Test error',
        path: ['name'],
      } as any;

      nameField.setErrors([mockError]);
      expect(nameField.errors).toEqual([mockError]);

      nameField.reset();
      expect(nameField.errors).toEqual([]);
    });

    it('should keep field errors when specified', () => {
      const { nameField } = setup();

      const mockError: FormIssue = {
        code: 'custom',
        message: 'Test error',
        path: ['name'],
      } as any;

      nameField.setErrors([mockError]);
      nameField.change('Jane');

      nameField.reset({ keep: { errors: true } });

      expect(nameField.value).toBe('John'); // value should reset
      expect(nameField.errors).toEqual([mockError]); // errors should be kept
    });

    it('should work with nested fields', () => {
      const { nestedField } = setup();

      nestedField.change('changed');
      expect(nestedField.value).toBe('changed');

      nestedField.reset();
      expect(nestedField.value).toBe('test'); // back to default
    });
  });

  describe('integration with existing methods', () => {
    it('should work with change and validation together', async () => {
      const { nameField } = setup();

      // Change to invalid value
      nameField.change('');

      // Validate the field
      const issues = await nameField.validate({ type: 'submit' });
      expect(issues).toHaveLength(1);
      expect(nameField.errors).toHaveLength(1);

      // Change to valid value
      nameField.change('Jane');

      // Validate again
      const validIssues = await nameField.validate({ type: 'submit' });
      expect(validIssues).toHaveLength(0);
      expect(nameField.errors).toHaveLength(0);
    });

    it('should work with focus, blur, and validation', async () => {
      const { nameField } = setup();

      nameField.focus();
      expect(nameField.meta.touched).toBe(true);

      nameField.blur();
      expect(nameField.meta.blurred).toBe(true);

      await nameField.validate({ type: 'blur' });
      // Should not throw and should work properly
    });

    it('should maintain consistency with form state', () => {
      const { nameField, form } = setup();

      const mockError: FormIssue = {
        code: 'custom',
        message: 'Test error',
        path: ['name'],
      } as any;

      // Set error through field
      nameField.setErrors([mockError]);

      // Should be reflected in form
      expect(form.field.errors('name')).toEqual([mockError]);
      expect(form.store.state.status.valid).toBe(false);

      // Clear error through field
      nameField.setErrors([]);

      // Should be reflected in form
      expect(form.field.errors('name')).toEqual([]);
      expect(form.store.state.status.valid).toBe(true);
    });

    it('should work with form-level operations', async () => {
      const { nameField, form } = setup();

      // Change field value
      nameField.change('Jane');
      expect(nameField.value).toBe('Jane');
      expect(form.field.get('name')).toBe('Jane');

      // Reset through form
      form.field.reset('name');
      expect(nameField.value).toBe('John');

      // Validate through form
      nameField.change('');
      const issues = await form.validate('name', { type: 'submit' });
      expect(issues).toHaveLength(1);
      expect(nameField.errors).toHaveLength(1);
    });
  });
});
