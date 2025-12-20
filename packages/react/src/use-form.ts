import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import type { FormOptions } from 'oxform-core';
import { FormApi } from 'oxform-core';
import type { StandardSchema } from 'oxform-core/schema';
import { useState } from 'react';

export type UseFormReturn<Schema extends StandardSchema> = FormApi<Schema>;

export const useForm = <Schema extends StandardSchema>(options: FormOptions<Schema>) => {
  const [api] = useState(() => {
    return new FormApi({ ...options });
  });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  return api satisfies UseFormReturn<Schema> as UseFormReturn<Schema>;
};
