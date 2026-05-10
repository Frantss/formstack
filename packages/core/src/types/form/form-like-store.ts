import type { ReadonlyStore, Store } from '@tanstack/store';

export type FormLikeStore<State = any> = Store<State> | ReadonlyStore<State>;
