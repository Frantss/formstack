import { FieldApi, type FieldOptions, type FieldProps } from '#/core/field-api';
import type { FieldMeta, FieldResetOptions, FieldSetErrorOptions, FormIssue, ValidateOptions } from '#/core/form-api.types';

import type { DeepKeys, DeepValue } from '#/core/more-types';
import type { EventLike, SchemaLike, StandardSchema } from '#/core/types';
import { useIsomorphicLayoutEffect } from '#/react/use-isomorphic-layout-effect';
import { useStore } from '@tanstack/react-store';
import { useCallback, useMemo, useState } from 'react';

export type UseFieldReturn<Value> = {
  api: FieldApi<any, any, Value>;
  value: Value;
  change: (value: Value) => void;
  blur: () => void;
  focus: () => void;
  register: () => void;
  validate: (options?: ValidateOptions) => Promise<FormIssue[]>;
  reset: (options?: FieldResetOptions<Value>) => void;
  setErrors: (errors: FormIssue[], options?: FieldSetErrorOptions) => void;
  props: FieldProps<Value>;
  meta: FieldMeta;
  errors: FormIssue[];
};

export const useField = <Schema extends SchemaLike, Name extends DeepKeys<StandardSchema.InferInput<Schema>>>(
  options: FieldOptions<Schema, Name>,
) => {
  type Value = DeepValue<StandardSchema.InferInput<Schema>, Name>;

  const [api] = useState(() => {
    return new FieldApi({ ...options });
  });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  const value = useStore(api.store, state => state.value);
  const defaultValue = useStore(api.store, state => state.defaultValue);
  const dirty = useStore(api.store, state => state.meta.dirty);
  const touched = useStore(api.store, state => state.meta.touched);
  const blurred = useStore(api.store, state => state.meta.blurred);
  const pristine = useStore(api.store, state => state.meta.pristine);
  const valid = useStore(api.store, state => state.meta.valid);
  const isDefault = useStore(api.store, state => state.meta.default);
  const errors = useStore(api.store, state => state.errors);

  const onChange = useCallback((event: EventLike) => api.change(event.target?.value), [api]);

  return useMemo(() => {
    return {
      api,
      value,
      blur: api.blur,
      focus: api.focus,
      change: api.change,
      register: api.register,
      validate: api.validate,
      reset: api.reset,
      setErrors: api.setErrors,
      errors,
      props: {
        value,
        defaultValue,
        ref: api.register(),
        onBlur: api.blur,
        onFocus: api.focus,
        onChange,
      },
      meta: {
        dirty,
        touched,
        blurred,
        pristine,
        valid,
        default: isDefault,
      },
    } satisfies UseFieldReturn<Value> as UseFieldReturn<Value>;
  }, [api, errors, value, defaultValue, onChange, dirty, touched, blurred, pristine, valid, isDefault]);
};
