import type { StandardSchemaV1 } from '@standard-schema/spec';

export type { StandardSchemaV1 as StandardSchema };
export type SchemaLike = StandardSchemaV1;
export type EventLike = { target?: { value: any } };
export type { PartialDeep, Simplify } from 'type-fest';
