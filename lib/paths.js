import { homedir } from 'node:os';
import { join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** Package root (repo root when developing; package root when published). */
export const PKG_ROOT = resolve(__dirname, '..');
export const SKILLS_SRC = join(PKG_ROOT, 'skills');
export const AGENTS_SRC = join(PKG_ROOT, 'agents');

/**
 * Install scope: project (default) or global user home.
 * @typedef {'project'|'global'} Scope
 */

export function userAgentsDir() {
  return join(homedir(), '.agents');
}

export function userSettingsPath() {
  return join(userAgentsDir(), 'settings.json');
}

/** Manifest of global installs performed by this Node CLI only. */
export function globalManifestPath() {
  return join(userAgentsDir(), 'skills-manifest.json');
}

/**
 * Resolve project root for project-local installs.
 * @param {string | undefined} projectPath relative or absolute; default cwd
 */
export function resolveProjectRoot(projectPath) {
  const base = projectPath && String(projectPath).trim() ? projectPath : process.cwd();
  const abs = isAbsolute(base) ? base : resolve(process.cwd(), base);
  if (!existsSync(abs)) {
    throw new Error(`Project path does not exist: ${abs}`);
  }
  return abs;
}

/**
 * Root for a given scope: project `.agents` or global `~/.agents`.
 * @param {Scope} scope
 * @param {string} [projectRoot]
 */
export function agentsRoot(scope, projectRoot) {
  if (scope === 'global') return userAgentsDir();
  return join(projectRoot, '.agents');
}

/**
 * Skills destination under a scope.
 * @param {Scope} scope
 * @param {string} [projectRoot]
 */
export function skillsDest(scope, projectRoot) {
  return join(agentsRoot(scope, projectRoot), 'skills');
}

/**
 * Subagents roster directory (custom subagents).
 * @param {Scope} scope
 * @param {string} [projectRoot]
 */
export function agentsDest(scope, projectRoot) {
  return join(agentsRoot(scope, projectRoot), 'agents');
}

/**
 * Human-readable label for a scope's skills destination.
 * @param {Scope} scope
 * @param {string} [projectRoot]
 */
export function destLabel(scope, projectRoot) {
  return skillsDest(scope, projectRoot);
}
