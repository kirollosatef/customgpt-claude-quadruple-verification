/**
 * Configuration Loader — Merges config from multiple sources.
 *
 * Merge chain (later overrides earlier):
 *   1. Plugin defaults (config/default-rules.json)
 *   2. User config (~/.claude/quadruple-verify-config.json)
 *   3. Project config ($PROJECT/.claude/quadruple-verify-config.json)
 *
 * Zero dependencies — Node.js built-ins only.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { findProjectRoot, getPluginRoot } from './utils.mjs';

/**
 * Load and merge configuration from all sources.
 * @returns {object} Merged configuration
 */
export function loadConfig() {
  const defaults = loadDefaults();
  const userConfig = loadUserConfig();
  const projectConfig = loadProjectConfig();

  return deepMerge(deepMerge(defaults, userConfig), projectConfig);
}

/**
 * Load plugin default configuration.
 */
function loadDefaults() {
  const pluginRoot = getPluginRoot();
  const defaultPath = resolve(pluginRoot, 'config', 'default-rules.json');
  return loadJSONFile(defaultPath);
}

/**
 * Load user-level configuration (~/.claude/quadruple-verify-config.json).
 */
function loadUserConfig() {
  const userPath = resolve(homedir(), '.claude', 'quadruple-verify-config.json');
  return loadJSONFile(userPath);
}

/**
 * Load project-level configuration ($PROJECT/.claude/quadruple-verify-config.json).
 */
function loadProjectConfig() {
  const projectRoot = findProjectRoot(process.cwd());
  const projectPath = resolve(projectRoot, '.claude', 'quadruple-verify-config.json');
  return loadJSONFile(projectPath);
}

/**
 * Safely load a JSON file. Returns empty object if file doesn't exist or is invalid.
 */
function loadJSONFile(filePath) {
  try {
    if (!existsSync(filePath)) return {};
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`[quadruple-verify] Config warning: Could not load ${filePath}: ${err.message}\n`);
    return {};
  }
}

/**
 * Deep merge two objects. Arrays are replaced, not concatenated.
 */
function deepMerge(base, override) {
  if (!override || typeof override !== 'object') return base;
  if (!base || typeof base !== 'object') return override;

  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      typeof override[key] === 'object' &&
      override[key] !== null &&
      !Array.isArray(override[key]) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

// Export for testing
export { deepMerge, loadJSONFile };


/**
 * Get the effective trust level from config.
 * @param {object} config
 * @returns {'minimal' | 'standard' | 'strict'}
 */
export function getTrustLevel(config) {
  const level = (config && config.trustLevel) || 'standard';
  if (['minimal', 'standard', 'strict'].includes(level)) return level;
  return 'standard';
}
