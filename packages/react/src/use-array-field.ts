import { createArrayField } from 'oxform-core';

import type { UseArrayFieldReturn } from '#types/use-array-field-return';
import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import { useSelector } from '@tanstack/react-store';
import type { AnyFormApi, ArrayFieldOptions, FormArrayFields, FormFieldValue } from 'oxform-core';
import { useMemo, useState } from 'react';

export const useArrayField = <Form extends AnyFormApi, const Name extends FormArrayFields<Form>>(
  options: ArrayFieldOptions<Form, Name>,
): UseArrayFieldReturn<FormFieldValue<Form, Name>> => {
  const [api] = useState(() => {
    return createArrayField({ ...options });
  });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  // todo: re-create api if form or name changes
  // spike: use optional context to cache the api instance

  const id = useSelector(api.store, state => state.id);
  const value = useSelector(api.store, state => state.value);
  const defaultValue = useSelector(api.store, state => state.defaultValue);
  const errors = useSelector(api.store, state => state.errors);
  const ref = useSelector(api.store, state => state.ref);
  const statusBlurred = useSelector(api.store, state => state.status.blurred);
  const statusTouched = useSelector(api.store, state => state.status.touched);
  const statusDirty = useSelector(api.store, state => state.status.dirty);
  const statusDefault = useSelector(api.store, state => state.status.default);
  const statusValid = useSelector(api.store, state => state.status.valid);
  const statusPristine = useSelector(api.store, state => state.status.pristine);

  return useMemo(() => {
    const state = {
      id,
      value,
      defaultValue,
      errors,
      ref,
      status: {
        blurred: statusBlurred,
        touched: statusTouched,
        dirty: statusDirty,
        default: statusDefault,
        valid: statusValid,
        pristine: statusPristine,
      },
    };

    return Object.create(api, {
      state: {
        enumerable: true,
        get: () => state,
      },
    });
  }, [
    api,
    id,
    value,
    defaultValue,
    errors,
    ref,
    statusBlurred,
    statusTouched,
    statusDirty,
    statusDefault,
    statusValid,
    statusPristine,
  ]) as UseArrayFieldReturn<FormFieldValue<Form, Name>>;
};
