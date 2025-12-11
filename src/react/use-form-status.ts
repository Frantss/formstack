import type { FormApi, FormStatus } from '#/core/form-api';
import type { SchemaLike } from '#/core/types';
import { useStore } from '@tanstack/react-store';
import { useMemo } from 'react';

export type UseFormStatusReturn = FormStatus;

export const useFormStatus = <Schema extends SchemaLike>({ form }: { form: FormApi<Schema> }) => {
  const dirty = useStore(form.store, state => state.status.dirty);
  const valid = useStore(form.store, state => state.status.valid);
  const submitting = useStore(form.store, state => state.status.submitting);
  const successful = useStore(form.store, state => state.status.successful);
  const validating = useStore(form.store, state => state.status.validating);
  const submits = useStore(form.store, state => state.status.submits);
  const submitted = useStore(form.store, state => state.status.submitted);

  return useMemo(() => {
    return {
      dirty,
      valid,
      submitting,
      successful,
      validating,
      submits,
      submitted,
    } satisfies UseFormStatusReturn as UseFormStatusReturn;
  }, [dirty, valid, submitting, successful, validating, submits, submitted]);
};
