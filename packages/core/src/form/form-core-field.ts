import type { FormIssuesByLevel, FormIssuesByLevelInput } from '#types/api/form-issue-entry';
import type { FormCore } from '#form/form-core';
import type { FormCoreFields } from '#form/form-core-fields';
import type { FieldBlurOptions } from '#types/api/field-blur-options';
import type { FieldChangeOptions } from '#types/api/field-change-options';
import type { FieldFocusOptions } from '#types/api/field-focus-options';
import type { FormIssuesOptions } from '#types/api/form-issues-options';
import type { FormResetFieldOptions } from '#types/api/form-reset-field-options';
import type { FormSetIssuesOptions } from '#types/api/form-set-issues-options';
import type { DeepKeys, DeepValue } from '#types/deep';
import { checksEngine_hasValidator, checksEngine_issueLevels } from '#utils/checks-issues-engine';
import { issues_hasAny, issues_merge, issues_normalize } from '#utils/issues';
import { fields_pathWithRoot } from '#utils/fields';
import { get } from '#utils/get';
import type { Updater } from '#utils/update/updater-';
import { batch } from '@tanstack/store';
import { setPath, stringToPath } from 'remeda';

export class FormCoreField<Values, Level extends string = string> {
  private core: FormCore<Values, Level>;
  private fields: FormCoreFields<Values, Level>;

  constructor({ core, fields }: { core: FormCore<Values, Level>; fields: FormCoreFields<Values, Level> }) {
    this.core = core;
    this.fields = fields;
  }

  public change = <const Name extends DeepKeys<Values>>(
    name: Name,
    updater: Updater<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    const shouldDirty = options?.should?.dirty !== false;
    const shouldTouch = options?.should?.touch !== false;
    const hasChangeValidators = checksEngine_hasValidator(this.core.options, 'change');
    const shouldValidate = options?.should?.validate ?? hasChangeValidators;

    batch(() => {
      this.core.set(name, updater);
      this.fields.set(name, {
        status: {
          touched: shouldTouch ? true : undefined,
          dirty: shouldDirty ? true : undefined,
        },
      });
    });

    if (shouldValidate) {
      void this.core.validate(name, { type: 'change' });
    }
  };

  public focus = <const Name extends DeepKeys<Values>>(name: Name, options?: FieldFocusOptions) => {
    const hasFocusValidators = checksEngine_hasValidator(this.core.options, 'focus');
    const shouldValidate = options?.should?.validate ?? hasFocusValidators;
    const field = this.fields.get(name);

    if (field.ref) field.ref.focus();

    if (!field.status.touched) this.fields.set(name as never, { status: { touched: true } });
    if (shouldValidate) {
      void this.core.validate(name as never, { type: 'focus' });
    }
  };

  public blur = <const Name extends DeepKeys<Values>>(name: Name, options?: FieldBlurOptions) => {
    const hasBlurValidators = checksEngine_hasValidator(this.core.options, 'blur');
    const shouldValidate = options?.should?.validate ?? hasBlurValidators;
    const field = this.fields.get(name);

    if (field.ref) field.ref.blur();

    if (!field.status.blurred) this.fields.set(name as never, { status: { blurred: true } });
    if (shouldValidate) {
      void this.core.validate(name as never, { type: 'blur' });
    }
  };

  public get = <const Name extends DeepKeys<Values>>(name: Name) => {
    return get(this.core.store.state.values as never, stringToPath(name)) as DeepValue<Values, Name>;
  };

  public status = <const Name extends DeepKeys<Values>>(name: Name) => {
    return this.core.store.state.fields[fields_pathWithRoot(name)].status;
  };

  public register = <const Name extends DeepKeys<Values>>(name: Name) => {
    return (element: HTMLElement | null) => {
      if (!element) return;
      this.fields.set(name, { ref: element });
    };
  };

  public unregister = <const Name extends DeepKeys<Values>>(name: Name) => {
    this.fields.set(name, { ref: null });
  };

  public issues = <const Name extends DeepKeys<Values>>(
    name: Name,
    options?: FormIssuesOptions,
  ): FormIssuesByLevel<Level> => {
    const path = fields_pathWithRoot(name);
    const issueLevels = checksEngine_issueLevels(this.core.options);
    if (!options?.nested) return this.core.store.state.fields[path].issues;

    const all = Object.keys(this.core.persisted.state.fields);
    const nested = all.filter(key => key === path || key.startsWith(`${path}.`));
    const issues = issues_merge(
      nested.map(curr => this.core.persisted.state.fields[curr].issues),
      issueLevels,
    );

    return issues;
  };

  public setIssues = <const Name extends DeepKeys<Values>>(
    name: Name,
    issues: FormIssuesByLevelInput<Level>,
    options?: FormSetIssuesOptions,
  ) => {
    const path = fields_pathWithRoot(name);
    const existing = this.core.persisted.state.fields[path].issues;
    let updated: FormIssuesByLevelInput<Level>;

    switch (options?.mode) {
      case 'append':
        updated = issues_merge([existing, issues], checksEngine_issueLevels(this.core.options));
        break;
      case 'keep':
        updated = issues_hasAny(existing) ? existing : issues;
        break;
      case 'replace':
      default:
        updated = issues;
        break;
    }

    this.fields.set(name, {
      issues: issues_normalize(updated, checksEngine_issueLevels(this.core.options)),
    });
  };

  public reset = <const Name extends DeepKeys<Values>>(
    name: Name,
    options?: FormResetFieldOptions<DeepValue<Values, Name>, Level>,
  ) => {
    const path = stringToPath(name as never);
    const defaultValue = get(this.core.options.defaultValues, path) as DeepValue<Values, Name>;
    const value = options?.value ?? defaultValue;

    batch(() => {
      this.fields.reset(name);
      this.core.persisted.setState(state => {
        return {
          ...state,
          values: setPath(state.values as never, path as never, value as never),
        };
      });
    });
  };
}
