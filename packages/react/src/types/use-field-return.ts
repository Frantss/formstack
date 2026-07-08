import type { EventLike, FieldApi } from 'oxform-core';

export type UseFieldReturn<Value, Level extends string = string> = FieldApi<Value, Level> & {
  props: {
    value: Value;
    ref: (element: HTMLElement | null) => void;
    onChange: (event: EventLike) => void;
    onBlur: (event: EventLike) => void;
    onFocus: (event: EventLike) => void;
  };
};
