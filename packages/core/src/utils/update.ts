export type UpdaterFn<TInput, TOutput = TInput> = (input: TInput) => TOutput;
export type Updater<TInput, TOutput = TInput> = TOutput | UpdaterFn<TInput, TOutput>;

export function update<TInput, TOutput = TInput>(updater: Updater<TInput, TOutput>, input: TInput): TOutput {
  return typeof updater === 'function' ? (updater as UpdaterFn<TInput, TOutput>)(input) : updater;
}
