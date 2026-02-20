/**
 * System Monitor — Kernel-level monitoring hooks for sensitive access detection.
 *
 * Detects:
 *   1. Bash commands accessing sensitive system paths
 *   2. Process listing for post-execution auditing
 *   3. Cross-platform support (Windows + Linux/Mac)
 *
 * All operations are async, non-blocking, and fail-open.
 */

import { execSync } from 'node:child_process';
import { platform } from 'node:os';

/**
 * Sensitive path patterns — commands touching these are flagged.
 */
const SENSITIVE_PATHS = [
  { id: 'etc-passwd', pattern: /\/etc\/passwd/i, description: 'System user database' },
  { id: 'etc-shadow', pattern: /\/etc\/shadow/i, description: 'System password hashes' },
  { id: 'ssh-keys', pattern: /~?\/?\.ssh\/(?:id_rsa|id_ed25519|id_dsa|authorized_keys|known_hosts|config)/i, description: 'SSH keys or config' },
  { id: 'ssh-dir', pattern: /\.ssh\//i, description: 'SSH directory access' },
  { id: 'bash-history', pattern: /\.bash_history|\.zsh_history|\.history/i, description: 'Shell history file' },
  { id: 'env-file', pattern: /\.env(?:\.|$)/i, description: 'Environment variable file' },
  { id: 'aws-credentials', pattern: /\.aws\/credentials/i, description: 'AWS credential file' },
  { id: 'kube-config', pattern: /\.kube\/config/i, description: 'Kubernetes configuration' },
  { id: 'docker-config', pattern: /\.docker\/config\.json/i, description: 'Docker credentials' },
  { id: 'gnupg-dir', pattern: /\.gnupg\//i, description: 'GPG keyring directory' },
  { id: 'npm-token', pattern: /\.npmrc/i, description: 'NPM authentication token' },
  { id: 'git-credentials', pattern: /\.git-credentials/i, description: 'Git credential store' },
  { id: 'win-sam', pattern: /system32[\\\/]config[\\\/](?:SAM|SECURITY|SYSTEM)/i, description: 'Windows security database' },
  { id: 'win-credential-store', pattern: /Credentials[\\\/]|credential\s+manager/i, description: 'Windows Credential Manager' },
  { id: 'win-dpapi', pattern: /Microsoft[\\\/]Protect/i, description: 'Windows DPAPI protected data' },
  { id: 'win-registry-secrets', pattern: /reg\s+(?:query|export).*(?:HKLM|HKCU).*(?:secret|password|credential|token)/i, description: 'Registry secret query' },
];

/**
 * Detect if a bash command or tool input accesses sensitive system paths.
 * @param {string} command - The command or path to check
 * @returns {Array<{id: string, description: string}>} List of detected sensitive accesses
 */
export function detectSensitiveAccess(command) {
  if (!command || typeof command !== 'string') return [];
  
  const detections = [];
  for (const { id, pattern, description } of SENSITIVE_PATHS) {
    if (pattern.test(command)) {
      detections.push({ id, description });
    }
  }
  return detections;
}

/**
 * Capture a snapshot of running processes for audit purposes.
 * Returns a summary (process count + top processes by name) rather than full listing.
 * @returns {{ platform: string, processCount: number, snapshot: string[] }}
 */
export function captureSystemState() {
  const os = platform();
  try {
    let output;
    if (os === 'win32') {
      output = execSync('tasklist /fo csv /nh', { encoding: 'utf-8', timeout: 5000 });
    } else {
      output = execSync('ps aux --no-headers 2>/dev/null || ps aux', { encoding: 'utf-8', timeout: 5000 });
    }
    
    const lines = output.trim().split('\n').filter(Boolean);
    
    // Count unique process names
    const processNames = new Map();
    for (const line of lines) {
      let name;
      if (os === 'win32') {
        // CSV format: "name.exe","PID","Session Name","Session#","Mem Usage"
        const match = line.match(/^"([^"]+)"/);
        name = match ? match[1] : 'unknown';
      } else {
        // ps aux format: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
        const parts = line.trim().split(/\s+/);
        name = parts.length >= 11 ? parts[10] : parts[parts.length - 1];
        name = name.split('/').pop() || name;
      }
      processNames.set(name, (processNames.get(name) || 0) + 1);
    }
    
    // Top 10 by count
    const sorted = [...processNames.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => name + (count > 1 ? ' (x' + count + ')' : ''));
    
    return {
      platform: os,
      processCount: lines.length,
      snapshot: sorted
    };
  } catch {
    return {
      platform: os,
      processCount: -1,
      snapshot: ['<capture-failed>']
    };
  }
}

/**
 * Log a system monitoring event to the audit trail.
 * @param {'sensitive-access' | 'process-snapshot'} eventType
 * @param {object} details
 * @param {Function} logFn - Audit logger function
 */
export function logSystemEvent(eventType, details, logFn) {
  if (typeof logFn === 'function') {
    try {
      logFn('system-monitor', { eventType, ...details });
    } catch {
      // fail-open
    }
  }
}
