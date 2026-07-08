import type { ArrayFieldApi, ArrayLike } from 'oxform-core';

export type UseArrayFieldReturn<Value extends ArrayLike, Level extends string = string> = ArrayFieldApi<Value, Level>;
