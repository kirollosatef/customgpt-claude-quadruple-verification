/**
 * Behavioral Sequence Detector — Tracks tool call patterns across a session.
 *
 * Inspired by SecureClaw's dual-layer defense and ClawHavoc's attack taxonomy.
 * Detects suspicious sequences of tool calls that individual static rules cannot catch:
 *
 *   1. Write-without-Read — Writing/editing a file never read in this session
 *   2. Rapid destructive ops — Multiple destructive commands in short succession
 *   3. Exfiltration pattern — Read sensitive file then immediately send data outbound
 *   4. Permission escalation — chmod/chown followed by execution of the modified file
 *
 * Non-blocking: writes warnings to stderr and returns them for audit logging.
 * State persists within a single hook process invocation via the session state file.
 *
 * Zero dependencies — Node.js built-ins only.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { findProjectRoot, getSessionId } from './utils.mjs';

const MAX_HISTORY = 50;
const DESTRUCTIVE_WINDOW_MS = 30_000; // 30 seconds
const DESTRUCTIVE_THRESHOLD = 3;

const SENSITIVE_FILE_PATTERNS = [
  /\.env$/i,
  /credentials/i,
  /secrets?\.(?:json|ya?ml|toml)/i,
  /private[_-]?key/i,
  /id_rsa/i,
  /\.pem$/i,
  /\.key$/i,
  /token/i,
];

const DESTRUCTIVE_PATTERNS = [
  /\brm\s+/,
  /\bgit\s+checkout\s+\./,
  /\bgit\s+reset\s+--hard/,
  /\bgit\s+clean\s+-/,
  /\bgit\s+branch\s+-[Dd]/,
  /\bdrop\s+(?:table|database)/i,
  /\btruncate\s+table/i,
];

const OUTBOUND_PATTERNS = [
  /\bcurl\b/,
  /\bwget\b/,
  /\bnc\b/,
  /\bnetcat\b/,
  /WebFetch/i,
  /WebSearch/i,
];

/**
 * Get the session state file path.
 */
function getStateFilePath() {
  const projectRoot = findProjectRoot(process.cwd());
  const dir = resolve(projectRoot, '.claude', 'quadruple-verify-audit');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const sessionId = getSessionId();
  return resolve(dir, `${sessionId}.behavior.json`);
}

/**
 * Load the current session state.
 */
function loadState() {
  const path = getStateFilePath();
  if (!existsSync(path)) {
    return { history: [], filesRead: [], filesWritten: [], warnings: [] };
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return { history: [], filesRead: [], filesWritten: [], warnings: [] };
  }
}

/**
 * Save the session state.
 */
function saveState(state) {
  const path = getStateFilePath();
  // Trim history to prevent unbounded growth
  if (state.history.length > MAX_HISTORY) {
    state.history = state.history.slice(-MAX_HISTORY);
  }
  writeFileSync(path, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Record a tool operation and check for suspicious behavioral patterns.
 *
 * @param {string} toolName - The tool that was used (e.g. 'Write', 'Bash', 'Read')
 * @param {object} toolInput - The tool input parameters
 * @returns {Array<{pattern: string, message: string}>} - Array of detected suspicious patterns
 */
export function trackAndDetect(toolName, toolInput = {}) {
  const state = loadState();
  const now = Date.now();
  const normalized = (toolName || '').toLowerCase();

  const entry = {
    tool: toolName,
    timestamp: now,
    filePath: toolInput.file_path || '',
    command: (toolInput.command || '').slice(0, 500),
    url: toolInput.url || '',
  };

  // Track file reads and writes
  if (normalized === 'read' && entry.filePath) {
    if (!state.filesRead.includes(entry.filePath)) {
      state.filesRead.push(entry.filePath);
    }
  }

  const warnings = [];

  // ─── Pattern 1: Write-without-Read ───────────────────────────────────────
  if ((normalized === 'write' || normalized === 'edit') && entry.filePath) {
    if (!state.filesRead.includes(entry.filePath)) {
      // Check if this is a new file creation (Write to nonexistent file is OK)
      if (normalized === 'edit') {
        warnings.push({
          pattern: 'write-without-read',
          message: `Editing file "${entry.filePath}" that was never read in this session. This commonly leads to incorrect edits.`
        });
      }
    }
    if (!state.filesWritten.includes(entry.filePath)) {
      state.filesWritten.push(entry.filePath);
    }
  }

  // ─── Pattern 2: Rapid Destructive Sequence ──────────────────────────────
  if (normalized === 'bash' && entry.command) {
    const isDestructive = DESTRUCTIVE_PATTERNS.some(p => p.test(entry.command));
    if (isDestructive) {
      const recentDestructive = state.history.filter(h =>
        h.tool.toLowerCase() === 'bash' &&
        DESTRUCTIVE_PATTERNS.some(p => p.test(h.command)) &&
        (now - h.timestamp) < DESTRUCTIVE_WINDOW_MS
      );
      if (recentDestructive.length >= DESTRUCTIVE_THRESHOLD - 1) {
        warnings.push({
          pattern: 'rapid-destructive',
          message: `${recentDestructive.length + 1} destructive commands in ${DESTRUCTIVE_WINDOW_MS / 1000}s. This may indicate an uncontrolled cleanup loop.`
        });
      }
    }
  }

  // ─── Pattern 3: Exfiltration Sequence ───────────────────────────────────
  if (normalized === 'bash' && entry.command) {
    const isOutbound = OUTBOUND_PATTERNS.some(p => p.test(entry.command));
    if (isOutbound) {
      // Check if a sensitive file was recently read
      const recentSensitiveReads = state.history.filter(h => {
        if (h.tool.toLowerCase() !== 'read') return false;
        if ((now - h.timestamp) > 60_000) return false; // within 60s
        return SENSITIVE_FILE_PATTERNS.some(p => p.test(h.filePath));
      });
      if (recentSensitiveReads.length > 0) {
        const files = recentSensitiveReads.map(h => h.filePath).join(', ');
        warnings.push({
          pattern: 'exfiltration-sequence',
          message: `Outbound network command shortly after reading sensitive file(s): ${files}. Verify this is intentional.`
        });
      }
    }
  }

  // Also detect outbound via WebFetch/WebSearch tools
  if (normalized === 'webfetch' || normalized === 'websearch') {
    const recentSensitiveReads = state.history.filter(h => {
      if (h.tool.toLowerCase() !== 'read') return false;
      if ((now - h.timestamp) > 60_000) return false;
      return SENSITIVE_FILE_PATTERNS.some(p => p.test(h.filePath));
    });
    if (recentSensitiveReads.length > 0) {
      const files = recentSensitiveReads.map(h => h.filePath).join(', ');
      warnings.push({
        pattern: 'exfiltration-sequence',
        message: `Web request shortly after reading sensitive file(s): ${files}. Verify no sensitive data is included.`
      });
    }
  }

  // ─── Pattern 4: Permission Escalation ───────────────────────────────────
  if (normalized === 'bash' && entry.command) {
    const chmodMatch = entry.command.match(/chmod\s+\S+\s+(\S+)/);
    const chownMatch = entry.command.match(/chown\s+\S+\s+(\S+)/);
    if (chmodMatch || chownMatch) {
      // Track the file that had permissions changed
      entry._permChanged = (chmodMatch && chmodMatch[1]) || (chownMatch && chownMatch[1]) || '';
    }

    // Check if we're executing a file that recently had permissions changed
    const execPatterns = [/\.\//, /bash\s+/, /sh\s+/, /python\s+/, /node\s+/];
    const isExec = execPatterns.some(p => p.test(entry.command));
    if (isExec) {
      const recentPermChanges = state.history.filter(h =>
        h._permChanged &&
        (now - h.timestamp) < 60_000 &&
        entry.command.includes(h._permChanged)
      );
      if (recentPermChanges.length > 0) {
        warnings.push({
          pattern: 'permission-escalation',
          message: `Executing a file whose permissions were just changed. This is a privilege escalation pattern.`
        });
      }
    }
  }

  // Append entry to history
  state.history.push(entry);

  // Log warnings to stderr
  for (const w of warnings) {
    process.stderr.write(`[quadruple-verify][behavior] WARNING: ${w.pattern} — ${w.message}\n`);
  }

  // Persist state
  saveState(state);

  return warnings;
}
