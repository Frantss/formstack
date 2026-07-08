import type { AnyFormApi, EventLike, FieldOptions, FormIssueLevels, FormFields, FormFieldValue } from 'oxform-core';

import type { UseFieldReturn } from '#types/use-field-return';
import { useFieldApi } from '#use-field-api';
import { useSelector } from '@tanstack/react-store';
import { useMemo } from 'react';

export const useField = <Form extends AnyFormApi, const Name extends FormFields<Form>>(
  options: FieldOptions<Form, Name>,
): UseFieldReturn<FormFieldValue<Form, Name>, FormIssueLevels<Form>> => {
  const api = useFieldApi(options);
  const id = useSelector(api.store, state => state.id);
  const value = useSelector(api.store, state => state.value);
  const defaultValue = useSelector(api.store, state => state.defaultValue);
  const issues = useSelector(api.store, state => state.issues);
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
      issues,
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
      id: {
        enumerable: true,
        get: () => id,
      },
      state: {
        enumerable: true,
        get: () => state,
      },
      props: {
        enumerable: true,
        get: () => {
          return {
            value,
            onBlur: (_event: EventLike) => api.blur(),
            onFocus: (_event: EventLike) => api.focus(),
            onChange: (event: EventLike) => api.change(event.target?.value),
            ref: api.register,
          };
        },
      },
    });
  }, [
    api,
    id,
    value,
    defaultValue,
    issues,
    ref,
    statusBlurred,
    statusTouched,
    statusDirty,
    statusDefault,
    statusValid,
    statusPristine,
  ]) as UseFieldReturn<FormFieldValue<Form, Name>, FormIssueLevels<Form>>;
};
