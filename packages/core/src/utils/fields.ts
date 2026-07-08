import { DEFAULT_FIELD_STATUS } from '#constants';
import type { FormOptions } from '#types/api/form-options';
import { checksEngine_issueLevels } from '#utils/checks-issues-engine';
import { issues_empty, issues_normalize } from '#utils/issues';
import { buildPathsMap } from '#utils/build-paths-map';
import type { FieldEntry } from '#utils/fields/field-entry';
import type { FieldSetOptions } from '#utils/fields/field-set-options';
import type { PersistedFields } from '#utils/fields/persisted-fields';
import { generateId } from '#utils/generate-id';
import { getAscendantPaths } from '#utils/get-ascendant-paths';

export type { FieldEntry } from '#utils/fields/field-entry';
export type { FieldSetOptions } from '#utils/fields/field-set-options';
export type { PersistedFields } from '#utils/fields/persisted-fields';

export const fields_root = '~root';

export const fields_pathWithRoot = (path: string) => {
  if (path.startsWith(fields_root)) return path;

  return `${fields_root}.${path}`;
};

export const fields_pathWithoutRoot = (path: string) => {
  const [, fixed] = path.split(`${fields_root}.`);

  return fixed;
};

export const fields_build = <Level extends string = string>(
  options: FormOptions<any, Level>,
  values: unknown = options.defaultValues,
): PersistedFields<Level> => {
  const issueLevels = checksEngine_issueLevels(options);

  const build = (path: string) => {
    return {
      id: generateId(),
      status: {
        ...DEFAULT_FIELD_STATUS,
        ...options?.defaultFieldStatus?.['*'],
        ...options?.defaultFieldStatus?.[fields_pathWithoutRoot(path)],
      },
      issues: issues_empty(issueLevels),
      ref: null,
    } satisfies FieldEntry<Level>;
  };

  return {
    [fields_root]: build(fields_root),
    ...buildPathsMap(values, build, fields_root),
  } satisfies PersistedFields<Level>;
};

export const fields_set = <Level extends string = string>(
  fields: PersistedFields<Level>,
  path: string,
  field: FieldSetOptions<Level>,
  options?: Pick<FormOptions<any, Level>, 'checks'>,
): PersistedFields<Level> => {
  const fixed = fields_pathWithRoot(path);
  const paths = getAscendantPaths(fixed);
  const issueLevels = checksEngine_issueLevels(options ?? {});
  const updated = paths.reduce((acc, curr) => {
    const entry = fields[curr];
    const target = curr === fixed;
    const issues = target && field.issues !== undefined ? issues_normalize(field.issues, issueLevels) : entry.issues;
    const ref = target ? (field.ref !== undefined ? field.ref : entry.ref) : entry.ref;

    return {
      ...acc,
      [curr]: {
        ...entry,
        issues,
        ref,
        status: {
          dirty: field.status?.dirty ?? entry.status.dirty,
          touched: field.status?.touched ?? entry.status.touched,
          blurred: field.status?.blurred ?? entry.status.blurred,
        },
      },
    };
  }, {});

  return {
    ...fields,
    ...updated,
  };
};

export const fields_delete = <Level extends string = string>(
  fields: PersistedFields<Level>,
  path: string,
): PersistedFields<Level> => {
  const fixed = fields_pathWithRoot(path);

  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => {
      return !key.includes(fixed);
    }),
  );
};

export const fields_reset = (
  fields: PersistedFields<any>,
  path: string,
  options: FormOptions<any, any>,
  values: unknown = options.defaultValues,
): PersistedFields<any> => {
  const deleted = fields_delete(fields, path);
  const updated = fields_build(options, values);

  return {
    ...updated,
    ...deleted,
  };
};

export const fields_shift = (
  fields: PersistedFields<any>,
  path: string,
  position: number,
  direction: 'left' | 'right',
): PersistedFields<any> => {
  const fixed = fields_pathWithRoot(path);
  let index = position;
  const left = direction === 'left';
  const swap = left ? -1 : 1;
  let next = undefined;

  const updated = { ...fields };

  while (true) {
    const from = `${fixed}.${index}`;
    const to = `${fixed}.${index + swap}`;
    const future = fields[to];
    const shouldBreak = left ? index === 1 || !updated[from] : !future;

    updated[to] = left ? updated[from] : (next ?? updated[from]);
    if (left || index === position) delete updated[from];

    if (shouldBreak) break;

    next = future;
    index = index + 1;
  }

  return updated;
};

export const fields_swap = (
  fields: PersistedFields<any>,
  path: string,
  from: number,
  to: number,
): PersistedFields<any> => {
  const fixed = fields_pathWithRoot(path);
  const fromPath = `${fixed}.${from}`;
  const toPath = `${fixed}.${to}`;
  const fromEntry = fields[fromPath];
  const toEntry = fields[toPath];
  const updated = { ...fields };

  if (toEntry) updated[fromPath] = toEntry;
  else delete updated[fromPath];

  if (fromEntry) updated[toPath] = fromEntry;
  else delete updated[toPath];

  return updated;
};

export const fields_move = (
  fields: PersistedFields<any>,
  path: string,
  from: number,
  to: number,
): PersistedFields<any> => {
  const fixed = fields_pathWithRoot(path);
  const updated = { ...fields };

  if (from === to) return updated;

  const sourcePath = `${fixed}.${from}`;
  const sourceEntry = fields[sourcePath];
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const backwards = from > to;

  const setOrDelete = (targetPath: string, entry: FieldEntry<any> | undefined) => {
    if (entry) updated[targetPath] = entry;
    else delete updated[targetPath];
  };

  setOrDelete(`${fixed}.${to}`, sourceEntry);

  if (backwards) {
    for (let i = start + 1; i <= end; i++) {
      setOrDelete(`${fixed}.${i}`, fields[`${fixed}.${i - 1}`]);
    }
  } else {
    for (let i = start; i < end; i++) {
      setOrDelete(`${fixed}.${i}`, fields[`${fixed}.${i + 1}`]);
    }
  }

  return updated;
};

export const fields_remove = (fields: PersistedFields<any>, path: string, index: number): PersistedFields<any> => {
  const fixed = fields_pathWithRoot(path);
  const updated = { ...fields };
  let position = index;

  while (true) {
    const currentPath = `${fixed}.${position}`;
    const nextPath = `${fixed}.${position + 1}`;
    const nextEntry = fields[nextPath];

    if (nextEntry) updated[currentPath] = nextEntry;
    else {
      delete updated[currentPath];
      break;
    }

    position = position + 1;
  }

  return updated;
};
