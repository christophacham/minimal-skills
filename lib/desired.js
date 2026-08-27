/**
 * Desired-state model for the interactive wizard.
 *
 * Pending changes are computed by comparing desired skill set under the
 * active scope/targets against a disk scan of currently installed skills.
 * Pure module — no I/O, no prompts.
 */
import { allSkillIds, defaultSelectedSkillIds, SKILLS_NEEDING_AGENTS } from './catalog.js';
import { isInstalled, isInstalledOtherScope, otherScope, otherScopePlacements } from './scan.js';

/**
 * @typedef {'project'|'global'} Scope
 * @typedef {import('./scan.js').InstalledSkill} InstalledSkill
 *
 * @typedef {{
 *   scope: Scope,
 *   selected: Set<string>,
 *   projectRoot: string,
 *   skipDeps: boolean,
 * }} DesiredState
 *
 * @typedef {{
 *   op: 'install'|'remove',
 *   id: string,
 *   scope: Scope,
 * }} SkillOp
 *
 * @typedef {{
 *   id: string,
 *   activeScope: Scope,
 *   otherScope: Scope,
 *   paths: string[],
 *   reason: string,
 * }} BlockedInstall
 *
 * @typedef {{
 *   skillOps: SkillOp[],
 *   blocked: BlockedInstall[],
 *   needAgents: boolean,
 *   removeAgentsIfOrphan: boolean,
 * }} ApplyPlan
 */

/**
 * @param {{
 *   projectRoot: string,
 *   scope?: Scope,
 *   selected?: Iterable<string>,
 *   skipDeps?: boolean,
 *   seedFromInstalled?: InstalledSkill[],
 *   seedDefaults?: boolean,
 * }} opts
 * @returns {DesiredState}
 */
export function createDesiredState(opts) {
  const scope = opts.scope || 'project';
  /** @type {Set<string>} */
  let selected;
  if (opts.selected) {
    selected = new Set([...opts.selected].filter((id) => allSkillIds().includes(id)));
  } else if (opts.seedFromInstalled) {
    selected = new Set(
      opts.seedFromInstalled
        .filter((x) => x.scope === scope)
        .map((x) => x.id),
    );
  } else if (opts.seedDefaults) {
    selected = new Set(defaultSelectedSkillIds());
  } else {
    selected = new Set();
  }
  return {
    scope,
    selected,
    projectRoot: opts.projectRoot,
    skipDeps: Boolean(opts.skipDeps),
  };
}

/**
 * Align selected with disk for the state's current scope.
 * @param {DesiredState} state
 * @param {InstalledSkill[]} installed
 */
export function resyncFromInstalled(state, installed) {
  state.selected = new Set(
    installed
      .filter((x) => x.scope === state.scope)
      .map((x) => x.id),
  );
  return state;
}

/**
 * @param {DesiredState} state
 * @param {string} id
 * @param {boolean} on
 */
export function setSelected(state, id, on) {
  if (!allSkillIds().includes(id)) return state;
  if (on) state.selected.add(id);
  else state.selected.delete(id);
  return state;
}

/**
 * @param {DesiredState} state
 * @param {string} id
 */
export function toggleSelected(state, id) {
  if (state.selected.has(id)) state.selected.delete(id);
  else if (allSkillIds().includes(id)) state.selected.add(id);
  return state;
}

/**
 * @param {DesiredState} state
 * @param {Iterable<string>} ids
 * @param {boolean} on
 */
export function setManySelected(state, ids, on) {
  for (const id of ids) setSelected(state, id, on);
  return state;
}

/**
 * @param {DesiredState} state
 * @param {Scope} scope
 * @param {InstalledSkill[]} installed
 * @param {{ resyncSelected?: boolean }} [opts]
 */
export function setScope(state, scope, installed, opts = {}) {
  state.scope = scope;
  if (opts.resyncSelected) {
    resyncFromInstalled(state, installed);
  }
  return state;
}

/**
 * Human reason when a skill is already present in the other scope.
 * @param {Scope} activeScope
 * @param {string} id
 */
export function crossScopeBlockReason(activeScope, id) {
  if (activeScope === 'project') {
    return (
      `${id} is already installed globally — project install blocked. ` +
      `Switch Scope to Global to manage it, or uninstall the global copy first.`
    );
  }
  return (
    `${id} is already installed in this project — global install blocked. ` +
    `Switch Scope to Project to manage it, or remove the project copy first.`
  );
}

/**
 * Diff desired selection against disk for the active scope + trees.
 * Installs are blocked (not scheduled) when the same skill id already exists
 * in the opposite scope (global ↔ project), by name.
 *
 * @param {DesiredState} state
 * @param {InstalledSkill[]} installed
 * @param {{ agentsPresent?: boolean }} [extras]
 * @returns {ApplyPlan}
 */
export function planChanges(state, installed, extras = {}) {
  /** @type {SkillOp[]} */
  const skillOps = [];
  /** @type {Map<string, BlockedInstall>} */
  const blockedMap = new Map();
  const known = allSkillIds();

  for (const id of known) {
    const want = state.selected.has(id);
    const cross = isInstalledOtherScope(installed, id, state.scope);
    const have = isInstalled(installed, id, state.scope);

    if (want && !have) {
      if (cross) {
        if (!blockedMap.has(id)) {
          const places = otherScopePlacements(installed, id, state.scope);
          blockedMap.set(id, {
            id,
            activeScope: state.scope,
            otherScope: otherScope(state.scope),
            paths: places.map((p) => p.path),
            reason: crossScopeBlockReason(state.scope, id),
          });
        }
        // do not schedule install
      } else {
        skillOps.push({ op: 'install', id, scope: state.scope });
      }
    } else if (!want && have) {
      skillOps.push({ op: 'remove', id, scope: state.scope });
    }
  }

  const selectedList = [...state.selected];
  const wantAgents = selectedList.some((id) => SKILLS_NEEDING_AGENTS.has(id));
  // Only schedule ensure when missing (avoids perpetual "pending" after apply).
  const needAgents = wantAgents && extras.agentsPresent !== true;
  // Drop roster when nothing selected still needs it, but this scope
  // previously installed a puller (current OM skills or legacy beads).
  const hadAgentPullerInstalled = installed.some(
    (x) => x.scope === state.scope && SKILLS_NEEDING_AGENTS.has(x.id),
  );
  const hadLegacyBeadsRoster =
    installed.some((x) => x.id === 'beads' && x.scope === state.scope) &&
    !state.selected.has('beads');
  const removeAgentsIfOrphan =
    !wantAgents && (hadAgentPullerInstalled || hadLegacyBeadsRoster);
  return {
    skillOps,
    blocked: [...blockedMap.values()].sort((a, b) => a.id.localeCompare(b.id)),
    needAgents,
    removeAgentsIfOrphan,
  };
}

/**
 * @param {ApplyPlan} plan
 */
export function planIsEmpty(plan) {
  return (
    plan.skillOps.length === 0 &&
    !plan.needAgents &&
    !plan.removeAgentsIfOrphan
  );
}

/**
 * True when there is nothing writable and no cross-scope blocks to surface.
 * @param {ApplyPlan} plan
 */
export function planHasNoWork(plan) {
  return planIsEmpty(plan) && (!plan.blocked || plan.blocked.length === 0);
}

/**
 * Human summary lines for status pane.
 * @param {ApplyPlan} plan
 */
export function summarizePlan(plan) {
  const installs = plan.skillOps.filter((o) => o.op === 'install');
  const removes = plan.skillOps.filter((o) => o.op === 'remove');
  /** @type {string[]} */
  const lines = [];
  if (installs.length) {
    lines.push(
      `install (${installs.length}): ` + installs.map((o) => o.id).join(', '),
    );
  }
  if (removes.length) {
    lines.push(
      `remove  (${removes.length}): ` + removes.map((o) => o.id).join(', '),
    );
  }
  if (plan.blocked?.length) {
    lines.push(
      `blocked (${plan.blocked.length}): ` +
        plan.blocked
          .map((b) => `${b.id} (already ${b.otherScope})`)
          .join(', '),
    );
  }
  if (plan.needAgents) lines.push('agents:  ensure roster under .agents/agents');
  if (plan.removeAgentsIfOrphan) {
    lines.push('agents:  remove roster (no selected skill needs agents)');
  }
  if (!lines.length) lines.push('(no pending changes)');
  return lines;
}

/**
 * Count pending skill ops.
 * @param {ApplyPlan} plan
 */
export function planCounts(plan) {
  return {
    install: plan.skillOps.filter((o) => o.op === 'install').length,
    remove: plan.skillOps.filter((o) => o.op === 'remove').length,
  };
}
