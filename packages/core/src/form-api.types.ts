import type { FormApi } from '#form-api';
import type { DeepKeys } from '#more-types';
import type { PartialDeep, Simplify, StandardSchema } from '#types';

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

export type FormBaseStore<Schema extends StandardSchema> = {
  values: StandardSchema.InferInput<Schema>;
  fields: Record<string, PersistedFieldMeta>;
  refs: Record<string, HTMLElement | null>;
  status: PersistedFormStatus;
  errors: Record<string, FormIssue[]>;
};

export type FormStore<Schema extends StandardSchema> = {
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

type FormValidatorSchema<Schema extends StandardSchema> = NoInfer<
  StandardSchema<PartialDeep<StandardSchema.InferInput<Schema>>>
>;
type FormValidatorFunction<Schema extends StandardSchema> = (store: FormStore<Schema>) => FormValidatorSchema<Schema>;
type FormValidator<Schema extends StandardSchema> = FormValidatorSchema<Schema> | FormValidatorFunction<Schema>;

export type FormOptions<Schema extends StandardSchema> = {
  schema: Schema;
  values?: StandardSchema.InferInput<Schema>;
  defaultValues: StandardSchema.InferInput<Schema>;
  validate?: {
    change?: FormValidator<Schema>;
    submit?: FormValidator<Schema>;
    blur?: FormValidator<Schema>;
    focus?: FormValidator<Schema>;
  };
  related?: Record<DeepKeys<StandardSchema.InferInput<Schema>>, DeepKeys<StandardSchema.InferInput<Schema>>[]>;
};

export type FormIssue = StandardSchema.Issue;

export type ValidationType = 'change' | 'submit' | 'blur' | 'focus';

export type ValidateOptions = {
  type?: ValidationType;
};

export type FieldChangeOptions = {
  should?: {
    /** Whether to validate the field after changing its value. Defaults to true. */
    validate?: boolean;
    /** Whether to mark the field as dirty after changing its value. Defaults to true. */
    dirty?: boolean;
    /** Whether to mark the field as touched after changing its value. Defaults to true. */
    touch?: boolean;
  };
};

export type FieldResetMeta = {
  blurred?: boolean;
  touched?: boolean;
  dirty?: boolean;
};

export type FieldResetKeepOptions = {
  errors?: boolean;
  refs?: boolean;
  meta?: boolean;
};

export type FormResetFieldOptions<Value> = {
  value?: Value;
  meta?: FieldResetMeta;
  keep?: FieldResetKeepOptions;
};

export type FormResetKeepOptions = {
  /** Keep current field errors */
  errors?: boolean;
  /** Keep current references to html input elements */
  refs?: boolean;
  /** Keep current field metadata */
  fields?: boolean;
};

export type FormResetOptions<Values> = {
  values?: Values;
  status?: Partial<PersistedFormStatus>;
  keep?: FormResetKeepOptions;
};

export type FieldSetErrorsMode = 'replace' | 'append' | 'keep';

export type FormSetErrorsOptions = {
  mode?: FieldSetErrorsMode;
};

export type FormSubmitSuccessHandler<Schema extends StandardSchema> = (
  data: StandardSchema.InferOutput<Schema>,
  form: FormApi<Schema>,
) => void | Promise<void>;

export type FormSubmitErrorHandler<Schema extends StandardSchema> = (
  issues: FormIssue[],
  form: FormApi<Schema>,
) => void | Promise<void>;

export type FormSubmitHandlers<Schema extends StandardSchema> = {
  onSuccess: FormSubmitSuccessHandler<Schema>;
  onError?: FormSubmitErrorHandler<Schema>;
};
