import type { FormChecksMap, FormCheckValidator } from '#types/api/form-checks-map';
import type { FormIssueLevel } from '#types/api/form-issue-entry';
import type { FormOptions } from '#types/api/form-options';
import type { ValidationType } from '#types/api/validation-type';
import { ERROR_ISSUE_LEVEL } from '#utils/issues';

const checksEngine_validationTypes = ['change', 'submit', 'blur', 'focus'] satisfies ValidationType[];

type ChecksEngineSchemaOrBuilder<Values, Level extends string> =
  | FormOptions<Values, Level>['schema']
  | FormCheckValidator<Values, Level>;

export type ChecksEngineValidationEntry<Values, Level extends string = string> = {
  type: ValidationType | undefined;
  level: FormIssueLevel<Level>;
  schemaOrBuilder: ChecksEngineSchemaOrBuilder<Values, Level>;
};

export type ChecksEngineValidationPlan<Values, Level extends string = string> = {
  entries: ChecksEngineValidationEntry<Values, Level>[];
  errorEntries: ChecksEngineValidationEntry<Values, Level>[];
  replacementTypes: ValidationType[];
};

export const checksEngine_issueLevels = <Level extends string>(
  options: Pick<FormOptions<any, Level>, 'checks'>,
): FormIssueLevel<Level>[] => {
  return [
    ERROR_ISSUE_LEVEL,
    ...Object.keys(options.checks ?? {}).filter(level => level !== ERROR_ISSUE_LEVEL),
  ] as FormIssueLevel<Level>[];
};

export const checksEngine_hasValidator = <Level extends string>(
  options: Pick<FormOptions<any, Level>, 'checks'>,
  type: ValidationType,
): boolean => {
  const configs = Object.values(options.checks ?? {}) as NonNullable<FormOptions<any, Level>['checks']>[Level][];

  return configs.some(config => config?.validate?.[type] !== undefined);
};

const checksEngine_errorValidationEntries = <Values, Level extends string>(
  options: FormOptions<Values, Level>,
  validationType: ValidationType | undefined,
  replacementTypes: ValidationType[],
): ChecksEngineValidationEntry<Values, Level>[] => {
  const errorConfig = options.checks?.[ERROR_ISSUE_LEVEL];

  if (validationType === undefined) {
    return [
      {
        type: undefined,
        level: ERROR_ISSUE_LEVEL,
        schemaOrBuilder: options.schema,
      },
      ...replacementTypes.flatMap(type => {
        const schemaOrBuilder = errorConfig?.validate?.[type];
        if (schemaOrBuilder === undefined) return [];

        return [
          {
            type,
            level: ERROR_ISSUE_LEVEL,
            schemaOrBuilder,
          },
        ];
      }),
    ];
  }

  if (validationType === 'submit') {
    return [
      {
        type: validationType,
        level: ERROR_ISSUE_LEVEL,
        schemaOrBuilder: errorConfig?.validate?.[validationType] ?? options.schema,
      },
    ];
  }

  const schemaOrBuilder = errorConfig?.validate?.[validationType];
  if (schemaOrBuilder === undefined) return [];

  return [
    {
      type: validationType,
      level: ERROR_ISSUE_LEVEL,
      schemaOrBuilder,
    },
  ];
};

export const checksEngine_validationPlan = <Values, Level extends string>(
  options: FormOptions<Values, Level>,
  validationType?: ValidationType,
): ChecksEngineValidationPlan<Values, Level> => {
  const replacementTypes = validationType ? [validationType] : checksEngine_validationTypes;
  const errorEntries = checksEngine_errorValidationEntries(options, validationType, replacementTypes);
  const issueEntries = Object.entries(options.checks ?? {}).filter(([level]) => {
    return level !== ERROR_ISSUE_LEVEL;
  }) as [Level, NonNullable<FormChecksMap<Values, Level>>[Level]][];
  const entries = [
    ...errorEntries,
    ...issueEntries.flatMap(([level, config]) => {
      return replacementTypes.flatMap(type => {
        const schemaOrBuilder = config?.validate?.[type];
        if (schemaOrBuilder === undefined) return [];

        return [
          {
            type,
            level: level as Level,
            schemaOrBuilder,
          },
        ];
      });
    }),
  ];

  return {
    entries,
    errorEntries,
    replacementTypes,
  };
};
