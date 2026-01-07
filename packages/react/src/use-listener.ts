import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import { createListener, type AnyFormLikeApi, type ApiSelector } from 'oxform-core';
import { useRef, useState } from 'react';

export const useListener = <Api extends AnyFormLikeApi, Selected>(
  api: Api,
  selector: ApiSelector<Api, Selected>,
  fn: (state: Selected) => void | Promise<void>,
) => {
  const selectorRef = useRef(selector);
  const fnRef = useRef(fn);

  selectorRef.current = selector;
  fnRef.current = fn;

  const [effect, setEffect] = useState(() => createListener(api, selectorRef.current, fnRef.current));

  useIsomorphicLayoutEffect(() => {
    return effect.mount();
  }, [effect]);

  useIsomorphicLayoutEffect(() => {
    setEffect(createListener(api, selector, fn));
  }, [api]);
};
