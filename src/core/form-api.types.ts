import type { PartialDeep, SchemaLike, Simplify, StandardSchema } from '#/core/types';

export type PersistedFormStatus = {
  submits: number;
  submitting: boolean;
  validating: boolean;
  successful: boolean;
  dirty: boolean;
};

export type FormStatus = Simplify<
  PersistedFormStatus & {
    submitted: boolean;
    valid: boolean;
  }
>;

export type PersistedFieldMeta = {
  blurred: boolean;
  touched: boolean;
  dirty: boolean;
};

export type FieldMeta = Simplify<
  PersistedFieldMeta & {
    touched: boolean;
    default: boolean;
    valid: boolean;
    pristine: boolean;
  }
>;

export type FormBaseStore<Schema extends SchemaLike> = {
  values: StandardSchema.InferInput<Schema>;
  fields: Record<string, PersistedFieldMeta>;
  refs: Record<string, HTMLElement | null>;
  status: PersistedFormStatus;
  errors: Record<string, FormIssue[]>;
};

export type FormStore<Schema extends SchemaLike> = {
  values: StandardSchema.InferInput<Schema>;
  fields: Record<string, FieldMeta>;
  refs: Record<string, HTMLElement | null>;
  status: FormStatus;
  errors: Record<string, FormIssue[]>;
};

export type FieldControl<Value> = {
  focus: () => void;
  blur: () => void;
  change: (value: Value) => void;
  register: (element: HTMLElement | null) => void;
};

type FormValidatorSchema<Schema extends SchemaLike> = NoInfer<
  StandardSchema<PartialDeep<StandardSchema.InferInput<Schema>>>
>;
type FormValidatorFunction<Schema extends SchemaLike> = (store: FormStore<Schema>) => FormValidatorSchema<Schema>;
type FormValidator<Schema extends SchemaLike> = FormValidatorSchema<Schema> | FormValidatorFunction<Schema>;

export type FormOptions<Schema extends SchemaLike> = {
  schema: Schema;
  values?: StandardSchema.InferInput<Schema>;
  defaultValues: StandardSchema.InferInput<Schema>;
  validate?: {
    change?: FormValidator<Schema>;
    submit?: FormValidator<Schema>;
    blur?: FormValidator<Schema>;
    focus?: FormValidator<Schema>;
  };
};

export type FormIssue = StandardSchema.Issue;

export type ValidationType = 'change' | 'submit' | 'blur' | 'focus';

export type ValidateOptions = {
  type: ValidationType;
};

export type FieldResetOptions<Value> = {
  value?: Value;
  meta?: Partial<PersistedFieldMeta>;
  keep?: {
    errors?: boolean;
    refs?: boolean;
    meta?: boolean;
  };
};

export type FieldSetErrorsMode = 'replace' | 'append' | 'keep';

export type FieldSetErrorOptions = {
  mode?: FieldSetErrorsMode;
}
