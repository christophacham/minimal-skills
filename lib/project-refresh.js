/**
 * Project-only skill refresh: overwrite existing project suite skills from the
 * running package. Never touches global installs.
 */
import { installSkill } from './fs-ops.js';
import { ensureSkillDeps } from './deps.js';
import { scanAllInstalled } from './scan.js';
import { suiteVersion } from './suite-version.js';

/**
 * @typedef {import('./scan.js').InstalledSkill} InstalledSkill
 */

/**
 * Project-scope placements from a scan list.
 * @param {InstalledSkill[]} installed
 * @returns {InstalledSkill[]}
 */
export function projectSkillPlacements(installed) {
  return installed.filter((x) => x.scope === 'project');
}

/**
 * Unique catalog skill ids present under the project (any tree).
 * @param {InstalledSkill[]} installed
 * @returns {string[]}
 */
export function uniqueProjectSkillIds(installed) {
  return [
    ...new Set(projectSkillPlacements(installed).map((x) => x.id)),
  ].sort((a, b) => a.localeCompare(b));
}

/**
 * True when the project has any suite skill dirs on disk.
 * @param {string} projectRoot
 */
export function projectHasInstalledSkills(projectRoot) {
  return uniqueProjectSkillIds(scanAllInstalled(projectRoot)).length > 0;
}

/**
 * Re-copy package skills over every project placement.
 * Global scope is never modified.
 *
 * @param {string} projectRoot
 * @param {{ skipDeps?: boolean }} [opts]
 * @returns {{
 *   refreshed: string[],
 *   ids: string[],
 *   errors: string[],
 *   depLines: string[],
 *   version: string,
 * }}
 */
export function refreshProjectSkills(projectRoot, opts = {}) {
  const installed = scanAllInstalled(projectRoot);
  const placements = projectSkillPlacements(installed).slice().sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  /** @type {string[]} */
  const refreshed = [];
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const ids = [];

  for (const place of placements) {
    try {
      installSkill(place.id, 'project', projectRoot);
      refreshed.push(place.id);
      if (!ids.includes(place.id)) ids.push(place.id);
    } catch (e) {
      errors.push(`refresh ${place.id}: ${e.message}`);
    }
  }

  /** @type {string[]} */
  const depLines = [];
  if (!opts.skipDeps && ids.length) {
    try {
      depLines.push(...ensureSkillDeps(ids, 'project', projectRoot));
    } catch (e) {
      depLines.push(`deps warn: ${e.message}`);
    }
  }

  return {
    refreshed,
    ids: uniqueProjectSkillIds(installed),
    errors,
    depLines,
    version: suiteVersion(),
  };
}
