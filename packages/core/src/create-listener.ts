import type { AnyFormLikeApi } from '#types/any-form-like-api';
import type { ApiSelector } from '#types/api-selector';
import { Derived, Effect } from '@tanstack/store';
import { isDeepEqual } from 'remeda';

type EffectState<Selected> = { state: Selected; initial: Selected; unchanged: boolean; skip: boolean };

export const createListener = <Api extends AnyFormLikeApi, Selected>(
  api: Api,
  selector: ApiSelector<Api, Selected>,
  fn: (state: Selected) => void | Promise<void>,
) => {
  const store = new Derived({
    deps: [api.store()],
    fn: ({ currDepVals, prevDepVals, prevVal }) => {
      const currentDeps = currDepVals[0] as any;
      const previousDeps = prevDepVals?.[0] as any;
      const previousState = prevVal as EffectState<Selected> | undefined;

      const skip = !previousState;
      const currentSelected = selector(currentDeps);
      const lastSelected = previousDeps ? selector(previousDeps) : undefined;
      const unchanged = isDeepEqual(currentSelected, lastSelected);

      return {
        initial: previousState?.initial ?? currentSelected,
        state: currentSelected,
        unchanged,
        skip,
      } satisfies EffectState<Selected>;
    },
  });

  return new Effect({
    deps: [store],
    fn: () => {
      if (store.state.skip) return;
      if (store.state.unchanged) return;

      void fn(store.state.state);
    },
  });
};

// const form = new FormApi({} as never) as FormApi<{ name: string }>;
// const effect = createApiEffect(
//   form,
//   state => state.values.name,
//   name => {
//     console.log(name);
//   },
// );
