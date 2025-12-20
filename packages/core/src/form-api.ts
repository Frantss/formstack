import { defaultStatus } from '#field-api.constants';
import type { FormOptions, FormResetOptions, FormSubmitErrorHandler, FormSubmitSuccessHandler } from '#form-api.types';
import { FormArrayFieldApi } from '#form-array-field-api';
import { FormContextApi } from '#form-context-api';
import { FormFieldApi } from '#form-field-api';
import type { StandardSchema } from '#types';

export class FormApi<Schema extends StandardSchema> {
  private context: FormContextApi<Schema>;
  public field: FormFieldApi<Schema>;
  public array: FormArrayFieldApi<Schema>;

  constructor(options: FormOptions<Schema>) {
    this.context = new FormContextApi(options);
    this.field = new FormFieldApi(this.context);
    this.array = new FormArrayFieldApi({ field: this.field, context: this.context });
  }

  public '~mount' = () => {
    const unsubscribe = this.context.store.mount();

    return unsubscribe;
  };

  public '~update' = (options: FormOptions<NoInfer<Schema>>) => {
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
    (onSuccess: FormSubmitSuccessHandler<NoInfer<Schema>>, onError?: FormSubmitErrorHandler<NoInfer<Schema>>) =>
    async () => {
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

  public reset = (options?: FormResetOptions<StandardSchema.InferInput<NoInfer<Schema>>>) => {
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
