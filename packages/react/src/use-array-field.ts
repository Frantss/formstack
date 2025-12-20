import { ArrayFieldApi, type DeepKeysOfType, type FieldOptions } from 'oxform-core';

import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import { useStore } from '@tanstack/react-store';
import type { DeepValue } from 'oxform-core';
import type { StandardSchema } from 'oxform-core/schema';
import { useMemo, useState } from 'react';

export type UseArrayFieldReturn<Value> = Omit<ArrayFieldApi<any, never, Value>, '~mount' | '~update'>;

export const useArrayField = <
  Schema extends StandardSchema,
  Name extends DeepKeysOfType<StandardSchema.InferInput<Schema>, any[] | null | undefined>,
>(
  options: FieldOptions<Schema, Name>,
) => {
  type Value = DeepValue<StandardSchema.InferInput<Schema>, Name>;

  const [api] = useState(() => {
    return new ArrayFieldApi({ ...options });
  });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  // todo: re-create api if form or name changes
  // spike: use optional context to cache the api instance

  const length = useStore(api.store(), state => ((state.value as any[]) ?? []).length);

  return useMemo(() => {
    void length;
    return api satisfies UseArrayFieldReturn<Value> as UseArrayFieldReturn<Value>;
  }, [api, length]);
};
