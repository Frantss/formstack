import { useSubscribe, type AnyApi } from '#use-subscribe';
import { useMemo } from 'react';

export type SubscribeProps<Api extends AnyApi, Selected> = {
  api: Api;
  selector: (state: ReturnType<Api['store']>['state']) => Selected;
} & {
  children: React.ReactNode | ((field: NoInfer<Selected>) => React.ReactNode);
};

export const Subscribe = <Api extends AnyApi, Selected>({ api, selector, children }: SubscribeProps<Api, Selected>) => {
  const selected = useSubscribe(api, selector);

  return useMemo(() => {
    return typeof children === 'function' ? children(selected as never) : children;
  }, [children, selected]);
};
