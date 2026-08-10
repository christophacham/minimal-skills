/**
 * Installer wizard entry.
 * Default: full-screen Ink TUI (ccstatusline-style).
 * Fallback: scrolling Clack wizard via runClackWizard / --clack on CLI.
 * The separate --legacy path is implemented in install-flow-legacy.js.
 */
export { runTuiWizard as runWizard } from './tui/run.js';

/** Optional Clack fallback kept for the --clack install path. */
export { runClackWizard } from './wizard-clack.js';
