import { useField, type UseFieldReturn } from '#use-field';
import type { DeepKeys, DeepValue, FieldOptions } from 'oxform-core';
import type { StandardSchema } from 'oxform-core/schema';
import { useMemo } from 'react';

export type FieldProps<
  Schema extends StandardSchema,
  Name extends DeepKeys<StandardSchema.InferInput<Schema>>,
> = FieldOptions<Schema, Name> & {
  children:
    | React.ReactNode
    | ((field: UseFieldReturn<DeepValue<StandardSchema.InferInput<Schema>, Name>>) => React.ReactNode);
};

export const Field = <Schema extends StandardSchema, Name extends DeepKeys<StandardSchema.InferInput<Schema>>>({
  children,
  ...options
}: FieldProps<Schema, Name>) => {
  const field = useField(options);

  return useMemo(() => {
    return typeof children === 'function' ? children(field) : children;
  }, [children, field]);
};
