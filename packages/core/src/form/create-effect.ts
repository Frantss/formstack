import type { AnyFormLikeApi } from '#types/form/any-form-like-api';
import type { ApiSelector } from '#types/form/api-selector';
import { isDeepEqual } from 'remeda';

export const createEffect = <Api extends AnyFormLikeApi, Selected>(
  api: Api,
  selector: ApiSelector<Api, Selected>,
  fn: (state: Selected) => void | Promise<void>,
) => {
  let previousSelected = selector(api.store.state);

  return api.store.subscribe(value => {
    const currentSelected = selector(value);
    if (isDeepEqual(currentSelected, previousSelected)) return;
    previousSelected = currentSelected;
    void fn(currentSelected);
  });
};
