#!/usr/bin/env node

/**
 * Import verification test — ensures all new v1.3.0 modules load correctly.
 */

const modules = [
  '../scripts/lib/ast-checker.mjs',
  '../scripts/lib/behavior-tracker.mjs',
  '../scripts/lib/capability-gate.mjs',
  '../scripts/lib/content-boundary.mjs',
  '../scripts/lib/context-optimizer.mjs',
  '../scripts/lib/inference-verifier.mjs',
  '../scripts/lib/model-router.mjs',
  '../scripts/lib/prompt-budget.mjs',
  '../scripts/lib/self-correction.mjs',
  '../scripts/lib/system-monitor.mjs',
  '../scripts/lib/rules-engine.mjs',
  '../scripts/lib/config-loader.mjs',
  '../scripts/lib/utils.mjs',
  '../scripts/lib/audit-logger.mjs',
  '../scripts/lib/research-verifier.mjs',
];

let passed = 0;
let failed = 0;

for (const mod of modules) {
  try {
    const m = await import(mod);
    const exports = Object.keys(m);
    console.log(`  OK  ${mod.split('/').pop()} -> [${exports.join(', ')}]`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${mod.split('/').pop()} -> ${err.message}`);
    failed++;
  }
}

console.log(`\nImport check: ${passed} passed, ${failed} failed out of ${modules.length}`);
if (failed > 0) process.exit(1);
