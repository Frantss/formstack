import { useSelector } from '@tanstack/react-store';
import type { UseFormStatusProps } from '#types/use-form-status-props';
import type { UseFormStatusReturn } from '#types/use-form-status-return';
import type { AnyFormApi, FormIssueLevels } from 'oxform-core';
import { useMemo } from 'react';

export const useFormStatus = <Form extends AnyFormApi>({
  form,
}: UseFormStatusProps<Form>): UseFormStatusReturn<FormIssueLevels<Form>> => {
  const dirty = useSelector(form.store, state => state.status.dirty);
  const valid = useSelector(form.store, state => state.status.valid);
  const submitting = useSelector(form.store, state => state.status.submitting);
  const successful = useSelector(form.store, state => state.status.successful);
  const validating = useSelector(form.store, state => state.status.validating);
  const submits = useSelector(form.store, state => state.status.submits);
  const submitted = useSelector(form.store, state => state.status.submitted);
  const blurred = useSelector(form.store, state => state.status.blurred);
  const touched = useSelector(form.store, state => state.status.touched);
  const pristine = useSelector(form.store, state => state.status.pristine);

  return useMemo(() => {
    return {
      dirty,
      valid,
      submitting,
      successful,
      validating,
      submits,
      submitted,
      blurred,
      touched,
      pristine,
    } satisfies UseFormStatusReturn<FormIssueLevels<Form>>;
  }, [dirty, valid, submitting, successful, validating, submits, submitted, blurred, touched, pristine]);
};
