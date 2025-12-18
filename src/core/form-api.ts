import { defaultStatus } from '#/core/field-api.constants';
import type {
  FormOptions,
  FormResetOptions,
  FormSubmitErrorHandler,
  FormSubmitSuccessHandler,
} from '#/core/form-api.types';
import { FormContextApi } from '#/core/form-context-api';
import { FormFieldApi } from '#/core/form-field-api';
import type { DeepKeys } from '#/core/more-types';
import type { SchemaLike } from '#/core/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';

export class FormApi<
  Schema extends SchemaLike,
  Values extends StandardSchemaV1.InferInput<Schema> = StandardSchemaV1.InferInput<Schema>,
  Field extends DeepKeys<Values> = DeepKeys<Values>,
> {
  private context: FormContextApi<Schema, Values, Field>;
  public field: FormFieldApi<Schema, Values, Field>;

  constructor(options: FormOptions<Schema>) {
    this.context = new FormContextApi(options);
    this.field = new FormFieldApi<Schema, Values, Field>(this.context as never);
  }

  public '~mount' = () => {
    const unsubscribe = this.context.store.mount();

    return unsubscribe;
  };

  public '~update' = (options: FormOptions<Schema>) => {
    this.context.options = options;
  };

  public get store() {
    return this.context.store;
  }

  public get status() {
    return this.context.store.state.status;
  }

  public get values() {
    return this.context.store.state.values;
  }

  public get options() {
    return this.context.options;
  }

  public get validate() {
    return this.context.validate;
  }

  public submit =
    (onSuccess: FormSubmitSuccessHandler<Schema>, onError?: FormSubmitErrorHandler<Schema>) => async () => {
      this.context.setStatus({ submitting: true, dirty: true });

      const issues = await this.context.validate(undefined, { type: 'submit' });
      const valid = issues.length === 0;

      if (valid) {
        await onSuccess(this.context.store.state.values as never, this as never);
      } else {
        await onError?.(issues, this as never);
      }

      this.context.setStatus({
        submits: this.context.persisted.state.status.submits + 1,
        submitting: false,
        successful: valid,
      });
    };

  public reset = (options?: FormResetOptions<Values>) => {
    this.context.persisted.setState(current => {
      return {
        values: options?.values ?? this.context.options.defaultValues,
        fields: options?.keep?.fields ? current.fields : {},
        refs: options?.keep?.refs ? current.refs : {},
        errors: options?.keep?.errors ? current.errors : {},
        status: {
          ...defaultStatus,
          ...options?.status,
        },
      };
    });
  };
}
