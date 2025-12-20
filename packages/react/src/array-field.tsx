import type { FieldProps } from '#field';
import { useArrayField, type UseArrayFieldReturn } from '#use-array-field';
import type { DeepKeys, DeepKeysOfType, DeepValue, FieldOptions } from 'oxform-core';
import type { StandardSchema } from 'oxform-core/schema';
import { useMemo } from 'react';

export type ArrayFieldProps<
  Schema extends StandardSchema,
  Name extends DeepKeysOfType<StandardSchema.InferInput<Schema>, any[] | null | undefined>,
> = FieldOptions<Schema, Name> & {
  children:
    | React.ReactNode
    | ((field: UseArrayFieldReturn<DeepValue<StandardSchema.InferInput<Schema>, Name>>) => React.ReactNode);
};

export const ArrayField = <Schema extends StandardSchema, Name extends DeepKeys<StandardSchema.InferInput<Schema>>>({
  children,
  ...options
}: FieldProps<Schema, Name>) => {
  const field = useArrayField(options);

  return useMemo(() => {
    return typeof children === 'function' ? children(field as never) : children;
  }, [children, field]);
};
