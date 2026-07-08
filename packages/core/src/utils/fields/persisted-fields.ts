import type { FieldEntry } from '#utils/fields/field-entry';

export type PersistedFields<Level extends string = string> = Record<string, FieldEntry<Level>>;
