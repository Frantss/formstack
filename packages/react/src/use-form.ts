import type { UseFormReturn } from '#types/use-form-return';
import { useFormStatus } from '#use-form-status';
import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import type { FormChecksMap, InferFormIssueLevels } from 'oxform-core';
import { createForm } from 'oxform-core';
import { useMemo, useState } from 'react';

type UseFormOptions<Values, Checks extends FormChecksMap<NoInfer<Values>, string> | undefined> = Parameters<
  typeof createForm<Values, Checks>
>[0];

export const useForm = <Values, const Checks extends FormChecksMap<NoInfer<Values>, string> | undefined = undefined>(
  options: UseFormOptions<Values, Checks>,
): UseFormReturn<Values, InferFormIssueLevels<{ checks: Checks }>> => {
  const [api] = useState(() => {
    return createForm({ ...options });
  });

  const status = useFormStatus({ form: api });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  // todo: re-create api if id changes

  return useMemo(() => {
    return Object.create(api, {
      status: {
        enumerable: true,
        get: () => status,
      },
    });
  }, [api, status]) as UseFormReturn<Values, InferFormIssueLevels<{ checks: Checks }>>;
};
