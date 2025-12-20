import { useStore } from '@tanstack/react-store';
import { ArrayFieldApi, FieldApi, FormApi } from 'oxform-core';

export type AnyApi =
  | FormApi<any>
  | FieldApi<any, any, any>
  | ArrayFieldApi<
      any,
      // @ts-expect-error todo: fix this
      any,
      any
    >;

export type AnyApiSelector<Api extends AnyApi, Selected> = (state: ReturnType<Api['store']>['state']) => Selected;

export const useSubscribe = <Api extends AnyApi, Selected>(api: Api, selector: AnyApiSelector<Api, Selected>) => {
  return useStore(api.store() as never, selector as never) as Selected;
};

// const schema = z.object({ name: z.string(), names: z.string().array() });
// const form = new FormApi({ schema, defaultValues: { name: 'John', names: ['Jane', 'Bob'] } });
// const field = new FieldApi({ form, name: 'name' });
// const array = new ArrayFieldApi({ form, name: 'names' });

// const a = useSubscribe(form, state => state.values);
// const b = useSubscribe(field, state => state.value);
// const c = useSubscribe(array, state => state.value);
