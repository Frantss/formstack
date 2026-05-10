import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import { createEffect, type AnyFormLikeApi, type ApiSelector } from 'oxform-core';
import { useRef, useState } from 'react';

export const useFormEffect = <Api extends AnyFormLikeApi, Selected>(
  api: Api,
  selector: ApiSelector<Api, Selected>,
  fn: (state: Selected) => void | Promise<void>,
) => {
  const selectorRef = useRef(selector);
  const fnRef = useRef(fn);

  selectorRef.current = selector;
  fnRef.current = fn;

  const [effect, setEffect] = useState(() => createEffect(api, selectorRef.current, fnRef.current));

  useIsomorphicLayoutEffect(() => {
    return () => {
      effect.unsubscribe();
    };
  }, [effect]);

  useIsomorphicLayoutEffect(() => {
    setEffect(createEffect(api, selector, fn));
  }, [api]);
};
