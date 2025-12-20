import { vi } from 'vitest';

export const viPromise = <T = void>() => {
  let resolvePromise: (value: T) => void;

  const promise = new Promise<T>(resolve => {
    resolvePromise = resolve;
  });

  const fn = vi.fn(() => promise);

  const release = async (value: T) => {
    resolvePromise(value);
    await promise;
  };

  return { fn, release };
};
