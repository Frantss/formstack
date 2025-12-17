import type { StandardSchema } from '#/core/types';

export const validate = async <Schema extends StandardSchema>(schema: Schema, input: unknown) => {
  let result = schema['~standard'].validate(input);
  if (result instanceof Promise) result = await result;

  return result as StandardSchema.Result<StandardSchema.InferOutput<Schema>>;
};
