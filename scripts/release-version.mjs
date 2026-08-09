#!/usr/bin/env node
/**
 * DIY suite release helper (no external version packages).
 *
 *   node scripts/release-version.mjs plan
 *   node scripts/release-version.mjs plan --github-output
 *   node scripts/release-version.mjs write 1.0.1
 *   node scripts/release-version.mjs list-tags   # debug
 *
 * Pure plan lives in lib/release-plan.js. This CLI reads package.json + git tags.
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planRelease,
  highestReleaseTag,
  parseSemver,
  tagFromVersion,
  RELEASE_COMMIT_PREFIX,
} from '../lib/release-plan.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PKG_PATH = join(ROOT, 'package.json');
const LOCK_PATH = join(ROOT, 'package-lock.json');
const README_PATH = join(ROOT, 'README.md');

function readPackageVersion() {
  const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
  return String(pkg.version ?? '');
}

/**
 * List local tags (caller should fetch --tags in CI).
 * @returns {string[]}
 */
function listGitTags() {
  try {
    const out = execFileSync('git', ['tag', '-l', 'v*'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Write package.json version; keep package-lock root version in sync if present.
 * @param {string} version
 */
function writeVersion(version) {
  if (!parseSemver(version)) {
    throw new Error(`write: invalid version ${version} (need X.Y.Z, no leading zeros)`);
  }
  const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
  pkg.version = version;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  if (existsSync(LOCK_PATH)) {
    const lock = JSON.parse(readFileSync(LOCK_PATH, 'utf8'));
    lock.version = version;
    if (lock.packages && lock.packages['']) {
      lock.packages[''].version = version;
    }
    writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n', 'utf8');
  }
}

/**
 * @param {import('../lib/release-plan.js').ReleasePlan} plan
 */
function emitGithubOutput(plan) {
  const path = process.env.GITHUB_OUTPUT;
  if (!path) {
    console.error('plan --github-output: GITHUB_OUTPUT not set');
    process.exit(1);
  }
  const lines = [
    `action=${plan.action}`,
    `package_version=${plan.packageVersion}`,
    `highest_tag=${plan.highestTag ?? ''}`,
    // Alias for older workflow consumers
    `latest_tag=${plan.highestTag ?? ''}`,
    `release_version=${plan.releaseVersion ?? ''}`,
    `release_tag=${plan.releaseTag ?? ''}`,
    `reason=${plan.reason.replace(/\r?\n/g, ' ')}`,
  ];
  appendFileSync(path, lines.join('\n') + '\n', 'utf8');
}

/**
 * Rewrite every `github:christophacham/claude-skills#v<oldTag>` token in
 * README.md to point at `v<newTag>`. Refuses to run if the source tag is
 * missing or the swap would be a no-op, so this can be safely wired into
 * the release workflow without ever silently corrupting docs.
 *
 * Why fail-closed:
 *   - We only ever swap a tag we know the README was last pointing at.
 *   - If the README has already moved on (e.g. a previous release ran this
 *     and we are re-running), we leave it alone instead of re-rewriting.
 *   - Loop break is handled by the workflow guard on the commit subject,
 *     not by this script.
 *
 * @param {string} oldTag  e.g. v1.0.0 (the tag the README currently tracks)
 * @param {string} newTag  e.g. v1.0.1 (the tag we are about to publish)
 * @returns {{ updated: boolean, from: string, to: string, hits: number, reason: string }}
 */
function syncReadmeTag(oldTag, newTag) {
  if (oldTag === newTag) {
    return {
      updated: false,
      from: oldTag,
      to: newTag,
      hits: 0,
      reason: 'old and new tag are identical — nothing to swap',
    };
  }
  if (!parseSemver(oldTag.slice(1)) || !parseSemver(newTag.slice(1))) {
    throw new Error(`syncReadmeTag: tags must be vX.Y.Z (got ${oldTag}, ${newTag})`);
  }
  if (!existsSync(README_PATH)) {
    throw new Error(`syncReadmeTag: ${README_PATH} does not exist`);
  }

  const before = readFileSync(README_PATH, 'utf8');
  const target = `github:christophacham/claude-skills#${oldTag}`;
  const replacement = `github:christophacham/claude-skills#${newTag}`;

  // No occurrences of the old tag → README is already ahead (or never had it).
  // Fail closed: do not rewrite, do not invent, do not loop.
  if (!before.includes(target)) {
    return {
      updated: false,
      from: oldTag,
      to: newTag,
      hits: 0,
      reason: `README does not contain ${target} — already ahead or never tracked it`,
    };
  }
  // Guard: never introduce the new tag into a place that already had it
  // (would imply duplicate installs in docs). Cheap sanity check.
  const occurrencesOfNew = before.split(replacement).length - 1;
  if (occurrencesOfNew > 0) {
    return {
      updated: false,
      from: oldTag,
      to: newTag,
      hits: 0,
      reason: `README already contains ${replacement} (${occurrencesOfNew}x) — refusing to duplicate`,
    };
  }

  const after = before.split(target).join(replacement);
  const hits = before.split(target).length - 1;
  if (after === before) {
    return {
      updated: false,
      from: oldTag,
      to: newTag,
      hits: 0,
      reason: 'no-op (defensive)',
    };
  }
  writeFileSync(README_PATH, after, 'utf8');
  return {
    updated: true,
    from: oldTag,
    to: newTag,
    hits,
    reason: `rewrote ${hits} occurrence(s) of ${target} → ${replacement}`,
  };
}

function usage() {
  console.log(`release-version — DIY suite tags (no external version libs)

Usage:
  node scripts/release-version.mjs plan [--github-output]
  node scripts/release-version.mjs write <X.Y.Z>
  node scripts/release-version.mjs readme-sync <oldTag> <newTag>   # rewrite README install refs
  node scripts/release-version.mjs list-tags

Policy:
  • Manual major/minor: bump package.json in a PR, merge → CI tags as-is
  • Auto patch: each main merge where package == highest tag → patch+1 + tag
  • First release: no tags yet → tag package.json version as-is
  • Release commits use prefix "${RELEASE_COMMIT_PREFIX}" so CI does not re-run
`);
}

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === '-h' || cmd === '--help') {
  usage();
  process.exit(cmd ? 0 : 1);
}

if (cmd === 'list-tags') {
  const tags = listGitTags();
  const highest = highestReleaseTag(tags);
  console.log(JSON.stringify({ tags, highest }, null, 2));
  process.exit(0);
}

if (cmd === 'plan') {
  const packageVersion = readPackageVersion();
  const tags = listGitTags();
  const highestTag = highestReleaseTag(tags);
  const plan = planRelease({ packageVersion, highestTag });
  console.log(JSON.stringify(plan, null, 2));
  if (args.includes('--github-output')) {
    emitGithubOutput(plan);
  }
  process.exit(0);
}

if (cmd === 'write') {
  const version = args[1];
  if (!version) {
    console.error('write: missing version (X.Y.Z)');
    process.exit(1);
  }
  writeVersion(version);
  console.log(JSON.stringify({ wrote: version, package: PKG_PATH }, null, 2));
  process.exit(0);
}

if (cmd === 'readme-sync') {
  const oldTag = args[1];
  const newTag = args[2];
  if (!oldTag || !newTag) {
    console.error('readme-sync: missing <oldTag> <newTag> (both must be vX.Y.Z)');
    process.exit(1);
  }
  const result = syncReadmeTag(oldTag, newTag);
  console.log(JSON.stringify({ readme: README_PATH, ...result }, null, 2));
  // Updated: caller (release workflow) will git add + commit.
  // Not updated: also success — README is already ahead, nothing to do.
  process.exit(0);
}

console.error(`unknown command: ${cmd}`);
usage();
process.exit(1);
