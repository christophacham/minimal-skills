import {
  cpSync,
  rmSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  lstatSync,
  symlinkSync,
  unlinkSync,
  readlinkSync,
} from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import {
  SKILLS_SRC,
  AGENTS_SRC,
  skillsDest,
  agentsDest,
} from './paths.js';
import {
  TOP_LEVEL_AGENTS,
  PANELIST_AGENTS,
  SKILLS_NEEDING_AGENTS,
  STALE_AGENT_FILES,
} from './catalog.js';

function isSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Remove a path whether it is a file, dir, or broken symlink.
 * @param {string} path
 */
function forceRemove(path) {
  try {
    if (existsSync(path) || isSymlink(path)) {
      rmSync(path, { recursive: true, force: true });
      return true;
    }
  } catch {
    try {
      unlinkSync(path);
      return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

/**
 * Create a relative symlink when possible; absolute on failure of relative;
 * Windows: try 'junction' for directories, then 'dir'.
 * @param {string} target absolute path of real skill dir or file
 * @param {string} dest symlink path
 * @returns {boolean}
 */
export function trySymlink(target, dest) {
  const absTarget = resolve(target);
  const absDest = resolve(dest);
  mkdirSync(dirname(absDest), { recursive: true });
  forceRemove(absDest);

  let linkValue = absTarget;
  try {
    linkValue = relative(dirname(absDest), absTarget) || '.';
  } catch {
    linkValue = absTarget;
  }

  const attempts =
    process.platform === 'win32'
      ? [
          () => symlinkSync(absTarget, absDest, 'junction'),
          () => symlinkSync(linkValue, absDest, 'dir'),
          () => symlinkSync(absTarget, absDest, 'dir'),
          () => symlinkSync(absTarget, absDest, 'file'),
        ]
      : [
          () => symlinkSync(linkValue, absDest),
          () => symlinkSync(absTarget, absDest),
        ];

  for (const attempt of attempts) {
    try {
      attempt();
      return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

/**
 * Place a single file: symlink preferred, copy fallback.
 * @param {string} src
 * @param {string} dest
 * @returns {'link'|'copy'}
 */
function placeFile(src, dest) {
  forceRemove(dest);
  if (trySymlink(src, dest)) return 'link';
  cpSync(src, dest);
  return 'copy';
}

/**
 * Install a skill: full copy from package into `.agents/skills`.
 * @param {string} skillId
 * @param {'global'|'project'} scope
 * @param {string} [projectRoot]
 * @returns {string} destination path
 */
export function installSkill(skillId, scope, projectRoot) {
  const src = join(SKILLS_SRC, skillId);
  if (!existsSync(src) || !statSync(src).isDirectory()) {
    throw new Error(`Unknown skill in package: ${skillId}`);
  }
  const destRoot = skillsDest(scope, projectRoot);
  const dest = join(destRoot, skillId);
  mkdirSync(destRoot, { recursive: true });
  forceRemove(dest);
  cpSync(src, dest, { recursive: true });
  return dest;
}

/**
 * Remove a skill from `.agents/skills`.
 * @param {string} skillId
 * @param {'global'|'project'} scope
 * @param {string} [projectRoot]
 */
export function removeSkill(skillId, scope, projectRoot) {
  const dest = join(skillsDest(scope, projectRoot), skillId);
  return forceRemove(dest);
}

/**
 * Install the standard agent roster (top-level + panelists).
 * Prefer symlinks to package sources; fall back to copy.
 * @param {'global'|'project'} scope
 * @param {string} [projectRoot]
 * @returns {{ agents: string[], panelists: string[], mode: 'link'|'copy' }}
 */
export function installAgents(scope, projectRoot) {
  const dest = agentsDest(scope, projectRoot);
  mkdirSync(dest, { recursive: true });
  /** @type {string[]} */
  const agents = [];
  /** @type {string[]} */
  const panelists = [];
  let anyCopy = false;

  for (const name of TOP_LEVEL_AGENTS) {
    const src = join(AGENTS_SRC, name);
    if (!existsSync(src)) continue;
    const kind = placeFile(src, join(dest, name));
    if (kind === 'copy') anyCopy = true;
    agents.push(name);
  }

  // Drop retired agent files from prior suite versions (e.g. beads-*).
  for (const stale of STALE_AGENT_FILES) {
    forceRemove(join(dest, stale));
  }

  const panelSrc = join(AGENTS_SRC, 'panelists');
  const panelDest = join(dest, 'panelists');
  if (existsSync(panelSrc)) {
    mkdirSync(panelDest, { recursive: true });
    for (const name of PANELIST_AGENTS) {
      const src = join(panelSrc, name);
      if (!existsSync(src)) continue;
      const kind = placeFile(src, join(panelDest, name));
      if (kind === 'copy') anyCopy = true;
      panelists.push(name);
    }
  }

  return { agents, panelists, mode: anyCopy ? 'copy' : 'link' };
}

/**
 * @param {string[]} agentNames e.g. ['coder.md']
 * @param {'global'|'project'} scope
 * @param {string} [projectRoot]
 */
export function removeAgents(agentNames, scope, projectRoot) {
  const dest = agentsDest(scope, projectRoot);
  let n = 0;
  for (const name of agentNames) {
    if (forceRemove(join(dest, name))) n++;
  }
  return n;
}

/**
 * @param {string[]} names panelist basenames
 * @param {'global'|'project'} scope
 * @param {string} [projectRoot]
 */
export function removePanelists(names, scope, projectRoot) {
  const dest = join(agentsDest(scope, projectRoot), 'panelists');
  let n = 0;
  for (const name of names) {
    if (forceRemove(join(dest, name))) n++;
  }
  if (existsSync(dest)) {
    try {
      if (readdirSync(dest).length === 0) rmSync(dest, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
  return n;
}

/**
 * Install a set of skills into .agents/skills and auto-attach agents when needed.
 * @param {string[]} skillIds
 * @param {'global'|'project'} scope
 * @param {string} [projectRoot]
 */
export function installSkillsBundle(skillIds, scope, projectRoot) {
  const result = {
    skills: [],
    agents: [],
    panelists: [],
  };
  for (const id of skillIds) {
    installSkill(id, scope, projectRoot);
    result.skills.push(id);
  }
  const needAgents = skillIds.some((id) => SKILLS_NEEDING_AGENTS.has(id));
  if (needAgents) {
    const a = installAgents(scope, projectRoot);
    result.agents = a.agents;
    result.panelists = a.panelists;
  }
  return result;
}

/**
 * @param {string} path
 * @returns {string|null}
 */
export function readLinkTarget(path) {
  try {
    if (isSymlink(path)) return readlinkSync(path);
  } catch {
    /* ignore */
  }
  return null;
}

export { skillsDest };
