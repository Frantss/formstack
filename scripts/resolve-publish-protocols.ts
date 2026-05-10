#!/usr/bin/env bun
/**
 * Rewrites `workspace:*` and `catalog:<name>` protocol refs in each
 * publishable workspace's package.json to real semver ranges, in-place.
 * Run this immediately before `changeset publish`.
 */

import { Glob } from 'bun';
import { dirname, join, resolve } from 'node:path';

type DepRecord = Record<string, string>;
type PackageJson = {
  name?: string;
  version?: string;
  private?: boolean;
  dependencies?: DepRecord;
  devDependencies?: DepRecord;
  peerDependencies?: DepRecord;
  optionalDependencies?: DepRecord;
  workspaces?:
    | string[]
    | {
        packages?: string[];
        catalog?: DepRecord;
        catalogs?: Record<string, DepRecord>;
      };
};

const DEP_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

const WORKSPACE_RE = /^workspace:/;
const CATALOG_RE = /^catalog:(.*)$/;

const repoRoot = resolve(import.meta.dir, '..');

async function readPkg(path: string): Promise<{ raw: string; json: PackageJson }> {
  const raw = await Bun.file(path).text();
  return { raw, json: JSON.parse(raw) };
}

async function writePkg(path: string, json: PackageJson, originalRaw: string) {
  const trailingNewline = originalRaw.endsWith('\n') ? '\n' : '';
  await Bun.write(path, `${JSON.stringify(json, null, 2)}${trailingNewline}`);
}

function getWorkspaceGlobs(root: PackageJson): string[] {
  const ws = root.workspaces;
  if (!ws) return [];
  return Array.isArray(ws) ? ws : (ws.packages ?? []);
}

function getCatalog(root: PackageJson, name: string): DepRecord | undefined {
  const ws = root.workspaces;
  if (!ws || Array.isArray(ws)) return undefined;
  if (name === '') return ws.catalog;
  return ws.catalogs?.[name];
}

async function discoverPackages(
  root: PackageJson,
): Promise<Map<string, { dir: string; pkg: PackageJson; raw: string }>> {
  const globs = getWorkspaceGlobs(root);
  const found = new Map<string, { dir: string; pkg: PackageJson; raw: string }>();
  for (const pattern of globs) {
    const glob = new Glob(`${pattern}/package.json`);
    for await (const rel of glob.scan({ cwd: repoRoot, onlyFiles: true })) {
      const abs = join(repoRoot, rel);
      const { raw, json } = await readPkg(abs);
      if (!json.name) continue;
      found.set(json.name, { dir: dirname(abs), pkg: json, raw });
    }
  }
  return found;
}

function resolveRange(
  spec: string,
  depName: string,
  pkgName: string,
  field: string,
  siblings: Map<string, { pkg: PackageJson }>,
  root: PackageJson,
): string {
  if (WORKSPACE_RE.test(spec)) {
    const sibling = siblings.get(depName);
    if (!sibling) {
      throw new Error(
        `[${pkgName}.${field}.${depName}] uses "${spec}" but no workspace package "${depName}" was found.`,
      );
    }
    if (!sibling.pkg.version) {
      throw new Error(
        `[${pkgName}.${field}.${depName}] sibling "${depName}" has no "version" field.`,
      );
    }
    return sibling.pkg.version;
  }

  const catalogMatch = spec.match(CATALOG_RE);
  if (catalogMatch) {
    const catalogName = catalogMatch[1] ?? '';
    const catalog = getCatalog(root, catalogName);
    const label = catalogName === '' ? 'default catalog' : `catalog "${catalogName}"`;
    if (!catalog) {
      throw new Error(
        `[${pkgName}.${field}.${depName}] uses "${spec}" but ${label} is not defined in the root package.json.`,
      );
    }
    const value = catalog[depName];
    if (!value) {
      throw new Error(
        `[${pkgName}.${field}.${depName}] uses "${spec}" but ${label} has no entry for "${depName}".`,
      );
    }
    if (WORKSPACE_RE.test(value) || CATALOG_RE.test(value)) {
      throw new Error(
        `[${pkgName}.${field}.${depName}] ${label} entry for "${depName}" is "${value}" — catalogs must contain real semver ranges.`,
      );
    }
    return value;
  }

  return spec;
}

async function main() {
  const rootPkgPath = join(repoRoot, 'package.json');
  const { json: root } = await readPkg(rootPkgPath);

  const all = await discoverPackages(root);
  const publishable = [...all.values()].filter(({ pkg }) => pkg.private !== true);

  if (publishable.length === 0) {
    console.log('No publishable workspace packages found.');
    return;
  }

  let totalChanges = 0;
  for (const entry of publishable) {
    const { dir, pkg, raw } = entry;
    const pkgPath = join(dir, 'package.json');
    let changed = 0;

    for (const field of DEP_FIELDS) {
      const deps = pkg[field];
      if (!deps) continue;
      for (const [depName, spec] of Object.entries(deps)) {
        if (!WORKSPACE_RE.test(spec) && !CATALOG_RE.test(spec)) continue;
        const next = resolveRange(spec, depName, pkg.name ?? dir, field, all, root);
        deps[depName] = next;
        console.log(`  ${pkg.name} ${field}.${depName}: ${spec} → ${next}`);
        changed++;
      }
    }

    if (changed > 0) {
      await writePkg(pkgPath, pkg, raw);
      totalChanges += changed;
    }
  }

  console.log(
    `Resolved ${totalChanges} protocol ref${totalChanges === 1 ? '' : 's'} across ${publishable.length} package${publishable.length === 1 ? '' : 's'}.`,
  );
}

await main();
