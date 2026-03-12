#!/usr/bin/env node

// CustomGPT Quadruple Verification — CLI
// Usage: npx @customgpt/claude-quadruple-verification [--help|--version|--verify|--uninstall]

import { existsSync, mkdirSync, cpSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const PLUGIN_NAME = 'customgpt-claude-quadruple-verification';
const REPO = 'kirollosatef/customgpt-claude-quadruple-verification';

// ── Helpers ──

function log(msg) { console.log(`  ${msg}`); }
function ok(msg)  { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); }
function warn(msg){ console.log(`  \x1b[33m!\x1b[0m ${msg}`); }
function err(msg) { console.error(`  \x1b[31m✗\x1b[0m ${msg}`); }

function getPluginsDir() {
  return join(homedir(), '.claude', 'plugins', PLUGIN_NAME);
}

function getVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    return pkg.version;
  } catch {
    return 'unknown';
  }
}

// ── Commands ──

function showHelp() {
  const version = getVersion();
  console.log(`
  \x1b[1mCustomGPT Quadruple Verification\x1b[0m v${version}

  Catch security bugs, placeholder code, and hallucinated claims
  in AI-generated code — before it ships.

  \x1b[1mUsage:\x1b[0m
    npx @customgpt/claude-quadruple-verification [command]

  \x1b[1mCommands:\x1b[0m
    (no args)     Install the plugin to ~/.claude/plugins/
    --help, -h    Show this help message
    --version, -v Print version number
    --verify      Run smoke test to check installation
    --uninstall   Remove the plugin from ~/.claude/plugins/

  \x1b[1mAlternative install (recommended):\x1b[0m
    In Claude Code, run:
    /plugin marketplace add ${REPO}

  \x1b[1mDocs:\x1b[0m https://github.com/${REPO}
`);
}

function showVersion() {
  console.log(getVersion());
}

function runVerify() {
  const verifyPath = join(ROOT, 'install', 'verify.mjs');
  if (existsSync(verifyPath)) {
    try {
      execSync(`node "${verifyPath}"`, { stdio: 'inherit' });
    } catch {
      process.exit(1);
    }
  } else {
    err('verify.mjs not found');
    process.exit(1);
  }
}

function runUninstall() {
  const dest = getPluginsDir();
  console.log();
  console.log('  \x1b[1mCustomGPT Quadruple Verification\x1b[0m — Uninstall');
  console.log('  ──────────────────────────────────────────────');
  console.log();

  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true });
    ok(`Removed ${dest}`);
  } else {
    warn(`Plugin not found at ${dest}`);
  }
  console.log();
}

function runInstall() {
  console.log();
  console.log('  \x1b[1mCustomGPT Quadruple Verification\x1b[0m — Installer');
  console.log('  ──────────────────────────────────────────────');
  console.log();

  // 1. Check Node version
  const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeVersion < 18) {
    err(`Node.js >= 18 required (found v${process.versions.node})`);
    process.exit(1);
  }
  ok(`Node.js v${process.versions.node}`);

  // 2. Determine install target
  const dest = getPluginsDir();
  log(`Installing to: ${dest}`);
  console.log();

  // 3. Create plugin directory
  mkdirSync(dest, { recursive: true });

  // 4. Copy plugin files
  const dirs = ['.claude-plugin', 'scripts', 'hooks', 'config'];
  const files = ['package.json', 'LICENSE'];

  for (const d of dirs) {
    const src = join(ROOT, d);
    if (existsSync(src)) {
      cpSync(src, join(dest, d), { recursive: true });
      ok(`Copied ${d}/`);
    }
  }

  for (const f of files) {
    const src = join(ROOT, f);
    if (existsSync(src)) {
      cpSync(src, join(dest, f));
      ok(`Copied ${f}`);
    }
  }

  console.log();

  // 5. Run smoke test
  log('Running verification...');
  try {
    const installSrc = join(ROOT, 'install');
    if (existsSync(installSrc)) {
      cpSync(installSrc, join(dest, 'install'), { recursive: true });
    }

    const verifyPath = join(dest, 'install', 'verify.mjs');
    if (existsSync(verifyPath)) {
      execSync(`node "${verifyPath}"`, { stdio: 'pipe' });
      ok('Smoke test passed');
    } else {
      warn('Smoke test not found — skipping');
    }
  } catch {
    rmSync(dest, { recursive: true, force: true });
    err('Smoke test failed — installation rolled back');
    process.exit(1);
  }

  console.log();

  // 6. Recommend marketplace for auto-updates
  console.log('  \x1b[1m\x1b[32mInstalled!\x1b[0m');
  console.log();
  console.log('  \x1b[1mFor auto-updates, use the marketplace instead:\x1b[0m');
  console.log();
  console.log('    In Claude Code, run:');
  console.log(`    \x1b[36m/plugin marketplace add ${REPO}\x1b[0m`);
  console.log(`    \x1b[36m/plugin install ${PLUGIN_NAME}@kirollosatef-customgpt-claude-quadruple-verification\x1b[0m`);
  console.log();
  console.log('  The marketplace version auto-updates on every session.');
  console.log();
}

// ── Main ──

const isDirectExecution =
  Boolean(process.argv[1]) &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  const arg = process.argv[2];

  switch (arg) {
    case '--help':
    case '-h':
      showHelp();
      break;
    case '--version':
    case '-v':
      showVersion();
      break;
    case '--verify':
      runVerify();
      break;
    case '--uninstall':
      runUninstall();
      break;
    default:
      runInstall();
      break;
  }
}
