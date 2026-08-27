/**
 * Disk scan of installed suite skills (catalog ids only).
 * Does not invent ownership — only reports presence of known skill dirs.
 */
import { existsSync, readdirSync, lstatSync, readlinkSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { allSkillIds } from './catalog.js';
import { skillsDest } from './paths.js';

/**
 * @typedef {'project'|'global'} Scope
 * @typedef {{
 *   id: string,
 *   scope: Scope,
 *   path: string,
 *   kind: 'dir'|'symlink'|'other',
 *   linkTarget?: string
 * }} InstalledSkill
 */

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listDirNames(dir) {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() || d.isSymbolicLink())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

/**
 * @param {string} path
 * @returns {{ kind: 'dir'|'symlink'|'other', linkTarget?: string }}
 */
function pathKind(path) {
  try {
    const st = lstatSync(path);
    if (st.isSymbolicLink()) {
      let linkTarget;
      try {
        linkTarget = readlinkSync(path);
      } catch {
        linkTarget = undefined;
      }
      return { kind: 'symlink', linkTarget };
    }
    if (st.isDirectory()) return { kind: 'dir' };
    return { kind: 'other' };
  } catch {
    return { kind: 'other' };
  }
}

/**
 * Scan one skills directory for catalog skill ids.
 * @param {Scope} scope
 * @param {string} [projectRoot]
 * @param {Set<string>} [knownIds]
 * @returns {InstalledSkill[]}
 */
export function scanSkillsDir(scope, projectRoot, knownIds = new Set(allSkillIds())) {
  const dest = skillsDest(scope, projectRoot);
  /** @type {InstalledSkill[]} */
  const out = [];
  for (const name of listDirNames(dest)) {
    if (!knownIds.has(name)) continue;
    const path = join(dest, name);
    const { kind, linkTarget } = pathKind(path);
    out.push({ id: name, scope, path, kind, linkTarget });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Full scan: project + global `.agents/skills`.
 * @param {string} projectRoot
 * @returns {InstalledSkill[]}
 */
export function scanAllInstalled(projectRoot) {
  const known = new Set(allSkillIds());
  /** @type {InstalledSkill[]} */
  const all = [];
  for (const scope of /** @type {Scope[]} */ (['project', 'global'])) {
    all.push(...scanSkillsDir(scope, projectRoot, known));
  }
  return all;
}

/**
 * Map of skillId → list of placements.
 * @param {InstalledSkill[]} list
 */
export function indexBySkillId(list) {
  /** @type {Map<string, InstalledSkill[]>} */
  const map = new Map();
  for (const item of list) {
    const arr = map.get(item.id) || [];
    arr.push(item);
    map.set(item.id, arr);
  }
  return map;
}

/**
 * True if skill id is present under scope.
 * @param {InstalledSkill[]} list
 * @param {string} id
 * @param {Scope} scope
 */
export function isInstalled(list, id, scope) {
  return list.some((x) => x.id === id && x.scope === scope);
}

/**
 * Opposite install scope.
 * @param {Scope} scope
 * @returns {Scope}
 */
export function otherScope(scope) {
  return scope === 'project' ? 'global' : 'project';
}

/**
 * Placements of a skill id in the opposite scope (any tree).
 * @param {InstalledSkill[]} list
 * @param {string} id
 * @param {Scope} activeScope
 * @returns {InstalledSkill[]}
 */
export function otherScopePlacements(list, id, activeScope) {
  const o = otherScope(activeScope);
  return list.filter((x) => x.id === id && x.scope === o);
}

/**
 * True if skill id exists anywhere in the opposite scope.
 * @param {InstalledSkill[]} list
 * @param {string} id
 * @param {Scope} activeScope
 */
export function isInstalledOtherScope(list, id, activeScope) {
  return otherScopePlacements(list, id, activeScope).length > 0;
}

/**
 * Status glyph for a skill under the active scope.
 * @param {InstalledSkill[]} list
 * @param {string} id
 * @param {Scope} scope
 */
export function skillStatus(list, id, scope) {
  return isInstalled(list, id, scope) ? 'installed' : 'missing';
}

/**
 * Resolve real path if possible (for link diagnostics).
 * @param {string} path
 */
export function tryRealpath(path) {
  try {
    return realpathSync(path);
  } catch {
    return null;
  }
}
