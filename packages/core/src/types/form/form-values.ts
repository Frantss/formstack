import type { AnyFormApi } from '#types/form/any-form-api';

export type FormValues<Form extends AnyFormApi> = Form['store']['state']['values'];
