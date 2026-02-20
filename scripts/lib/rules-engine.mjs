/**
 * Rules Engine — All Cycle 1 + Cycle 2 verification rules.
 * Cycle 4 rules are in research-verifier.mjs and merged via getAllRules().
 *
 * Each rule: { id, description, pattern (RegExp), appliesTo, fileExtensions?, message }
 *
 * appliesTo: 'file-write' | 'bash' | 'mcp' | 'web' | 'all'
 * fileExtensions: optional array of extensions (e.g. ['.py']). If omitted, applies to all.
 */

import { getAllCycle4Rules } from './research-verifier.mjs';

// ─── Cycle 1: Code Quality Rules ────────────────────────────────────────────

const CYCLE1_RULES = [
  {
    id: 'no-todo',
    description: 'Block TODO/FIXME/HACK/XXX comments in code',
    pattern: /\b(TODO|FIXME|HACK|XXX)\b/,
    appliesTo: 'file-write',
    fileExtensions: null, // all code files
    message: 'Code contains a TODO/FIXME/HACK/XXX comment. Remove placeholder comments and implement the actual logic.'
  },
  {
    id: 'no-empty-pass',
    description: 'Block placeholder "pass" statements in Python',
    pattern: /^\s*pass\s*$/m,
    appliesTo: 'file-write',
    fileExtensions: ['.py', '.pyi'],
    message: 'Python file contains a bare "pass" statement. Implement the actual logic instead of using a placeholder.'
  },
  {
    id: 'no-not-implemented',
    description: 'Block NotImplementedError in Python',
    pattern: /raise\s+NotImplementedError/,
    appliesTo: 'file-write',
    fileExtensions: ['.py', '.pyi'],
    message: 'Code raises NotImplementedError. Implement the actual functionality instead of leaving a stub.'
  },
  {
    id: 'no-ellipsis',
    description: 'Block ellipsis placeholder in Python',
    pattern: /^\s*\.\.\.\s*$/m,
    appliesTo: 'file-write',
    fileExtensions: ['.py', '.pyi'],
    message: 'Python file contains an ellipsis (...) placeholder. Implement the actual logic.'
  },
  {
    id: 'no-placeholder-text',
    description: 'Block placeholder/stub text in code',
    pattern: /\b(placeholder|stub|mock implementation|implement\s+this|add\s+implementation\s+here|your\s+code\s+here)\b/i,
    appliesTo: 'file-write',
    fileExtensions: null,
    message: 'Code contains placeholder/stub text. Write the complete implementation.'
  },
  {
    id: 'no-throw-not-impl',
    description: 'Block "throw new Error(not implemented)" in JS/TS',
    pattern: /throw\s+new\s+Error\s*\(\s*['"`].*not\s+implemented/i,
    appliesTo: 'file-write',
    fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
    message: 'Code throws a "not implemented" error. Implement the actual functionality.'
  },
  // ─── OpenClaw-inspired: Completeness Detection (Change 5) ───────────────
  {
    id: 'no-empty-catch',
    description: 'Block empty catch/except blocks that silently swallow errors',
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/,
    appliesTo: 'file-write',
    fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
    message: 'Empty catch block silently swallows errors. Add proper error handling logic.'
  },
  {
    id: 'no-bare-except',
    description: 'Block bare except clauses in Python that catch all exceptions',
    pattern: /\bexcept\s*:/,
    appliesTo: 'file-write',
    fileExtensions: ['.py', '.pyi'],
    message: 'Bare except: clause catches all exceptions including KeyboardInterrupt and SystemExit. Specify the exception type (e.g. except ValueError:).'
  },
  {
    id: 'no-console-only-error',
    description: 'Block catch blocks that only console.log the error without handling it',
    pattern: /catch\s*\(\s*(\w+)\s*\)\s*\{\s*console\.(log|error|warn)\s*\(\s*\1\s*\)\s*;?\s*\}/,
    appliesTo: 'file-write',
    fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
    message: 'Catch block only logs the error without handling it. Add recovery logic, rethrow, or return an error response.'
  },
  {
    id: 'no-empty-function-body',
    description: 'Block empty function bodies in JS/TS',
    pattern: /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))\s*[^{]*\{\s*\}/,
    appliesTo: 'file-write',
    fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
    message: 'Function has an empty body. Write the complete implementation.'
  },
  {
    id: 'no-any-type',
    description: 'Block TypeScript "any" type usage (configurable — disabled by default)',
    pattern: /:\s*any\b/,
    appliesTo: 'file-write',
    fileExtensions: ['.ts', '.tsx'],
    message: 'TypeScript code uses the "any" type which bypasses type safety. Use a specific type or "unknown" instead.'
  }
];

// ─── Cycle 2: Security Rules ────────────────────────────────────────────────

const CYCLE2_RULES = [
  {
    id: 'no-eval',
    description: 'Block eval() usage',
    pattern: /\beval\s*\(/,
    appliesTo: 'file-write',
    fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.py'],
    message: 'Code uses eval(). This is a critical security risk (code injection). Use a safe alternative.'
  },
  {
    id: 'no-exec',
    description: 'Block exec() usage in Python',
    pattern: /\bexec\s*\(/,
    appliesTo: 'file-write',
    fileExtensions: ['.py'],
    message: 'Python code uses exec(). This allows arbitrary code execution. Use a safe alternative.'
  },
  {
    id: 'no-os-system',
    description: 'Block os.system() in Python',
    pattern: /\bos\.system\s*\(/,
    appliesTo: 'file-write',
    fileExtensions: ['.py'],
    message: 'Python code uses os.system(). Use subprocess.run() with shell=False instead.'
  },
  {
    id: 'no-shell-true',
    description: 'Block shell=True in Python subprocess',
    pattern: /shell\s*=\s*True/,
    appliesTo: 'file-write',
    fileExtensions: ['.py'],
    message: 'Python code uses shell=True in subprocess. This enables shell injection. Use shell=False and pass args as a list.'
  },
  {
    id: 'no-hardcoded-secrets',
    description: 'Block hardcoded API keys, passwords, and tokens',
    pattern: /(?:api[_-]?key|api[_-]?secret|password|passwd|secret[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key)\s*[:=]\s*['"`][A-Za-z0-9+/=_\-]{8,}/i,
    appliesTo: 'file-write',
    fileExtensions: null,
    message: 'Code contains what appears to be a hardcoded secret (API key, password, or token). Use environment variables or a secrets manager instead.'
  },
  {
    id: 'no-raw-sql',
    description: 'Block SQL injection via string concatenation',
    pattern: /(?:f['"`].*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\s+.*\{|(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\s+.*(?:['"]\s*\+|\+\s*['"]|\$\{|%s|\.format\())/i,
    appliesTo: 'file-write',
    fileExtensions: null,
    message: 'Code constructs SQL using string concatenation/interpolation. Use parameterized queries to prevent SQL injection.'
  },
  {
    id: 'no-innerhtml',
    description: 'Block innerHTML assignment (XSS risk)',
    pattern: /\.innerHTML\s*=/,
    appliesTo: 'file-write',
    fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.html'],
    message: 'Code assigns to .innerHTML which enables XSS attacks. Use .textContent or a sanitization library instead.'
  },
  {
    id: 'no-rm-rf',
    description: 'Block destructive rm -rf on root or home',
    pattern: /rm\s+(-[a-zA-Z]*)?r[a-zA-Z]*f[a-zA-Z]*\s+(?:\/(?:\s|$|\*)|\$HOME|\$\{HOME\}|~\/|\/root|C:\\)/i,
    appliesTo: 'bash',
    fileExtensions: null,
    message: 'Command attempts destructive recursive delete on a critical path. This could destroy the system.'
  },
  {
    id: 'no-chmod-777',
    description: 'Block world-writable permissions',
    pattern: /chmod\s+(?:.*\s)?777\b/,
    appliesTo: 'bash',
    fileExtensions: null,
    message: 'Command sets world-writable permissions (777). Use more restrictive permissions (e.g. 755 or 644).'
  },
  {
    id: 'no-curl-pipe-sh',
    description: 'Block curl/wget piped to shell execution',
    pattern: /(?:curl|wget)\s+.*\|\s*(?:ba)?sh/,
    appliesTo: 'bash',
    fileExtensions: null,
    message: 'Command pipes downloaded content directly to a shell. Download first, inspect, then execute.'
  },
  {
    id: 'no-insecure-url',
    description: 'Block non-HTTPS URLs (except localhost)',
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/,
    appliesTo: 'web',
    fileExtensions: null,
    message: 'URL uses insecure HTTP instead of HTTPS. Use HTTPS for all non-localhost connections.'
  },
  // ─── OpenClaw/ClawHavoc-inspired: Agentic Security Rules (Change 2) ────
  {
    id: 'no-system-prompt-leak',
    description: 'Block patterns that could leak system prompts or agent instructions',
    pattern: /(?:print|echo|console\.log|logger?\.\w+)\s*\(.*(?:system[_\s]?prompt|CLAUDE\.md|instructions|<system>)/i,
    appliesTo: 'file-write',
    fileExtensions: null,
    message: 'Code appears to output system prompt or agent instruction content. This is a context window exfiltration risk (OWASP ASI-10).'
  },
  {
    id: 'no-base64-exfil',
    description: 'Block base64-encoded payloads in bash commands (credential exfiltration vector)',
    pattern: /(?:echo|printf)\s+['"]?[A-Za-z0-9+/]{40,}={0,2}['"]?\s*\|\s*(?:base64|curl|nc|wget)/,
    appliesTo: 'bash',
    fileExtensions: null,
    message: 'Command contains a long base64 string piped to an external tool. This pattern is associated with credential exfiltration (ClawHavoc attack #2).'
  },
  {
    id: 'no-env-dump',
    description: 'Block commands that dump all environment variables (may expose secrets)',
    pattern: /(?:^|\||\&\&|\;)\s*(?:env|printenv|set)\s*(?:$|\||>|;)/m,
    appliesTo: 'bash',
    fileExtensions: null,
    message: 'Command dumps all environment variables which may expose API keys and secrets. Access specific variables instead (e.g. echo $PATH).'
  },
  {
    id: 'no-data-exfil-redirect',
    description: 'Block sending local file contents to remote URLs',
    pattern: /(?:curl\s+.*-d\s+@|curl\s+.*--data-binary\s+@|wget\s+.*--post-file|nc\s+(?!localhost|127\.0\.0\.1))/,
    appliesTo: 'bash',
    fileExtensions: null,
    message: 'Command sends local file data to a remote endpoint. This is a data exfiltration pattern (ClawHavoc attack #2). Verify the destination is trusted.'
  },
  {
    id: 'no-pickle-load',
    description: 'Block pickle deserialization (arbitrary code execution vector)',
    pattern: /\bpickle\.(?:load|loads)\s*\(/,
    appliesTo: 'file-write',
    fileExtensions: ['.py', '.pyi'],
    message: 'Code uses pickle.load/loads which can execute arbitrary code during deserialization (OWASP ASI-04). Use json, msgpack, or other safe formats.'
  }
];

/**
 * Run Cycle 1 (code quality) rules against content.
 * @param {string} content - The code content to verify
 * @param {string} fileExt - File extension (e.g. '.py')
 * @param {string} context - 'file-write' | 'bash' | 'mcp' | 'web'
 * @param {object} config - Configuration with enabled/disabled rules
 * @returns {Array<{ruleId: string, message: string}>} - Array of violations
 */
export function runCycle1(content, fileExt, context, config = {}) {
  return _runRules(CYCLE1_RULES, content, fileExt, context, config);
}

/**
 * Run Cycle 2 (security) rules against content.
 * @param {string} content - The code content to verify
 * @param {string} fileExt - File extension (e.g. '.py')
 * @param {string} context - 'file-write' | 'bash' | 'mcp' | 'web'
 * @param {object} config - Configuration with enabled/disabled rules
 * @returns {Array<{ruleId: string, message: string}>} - Array of violations
 */
export function runCycle2(content, fileExt, context, config = {}) {
  return _runRules(CYCLE2_RULES, content, fileExt, context, config);
}

/**
 * Get all rules for documentation/testing.
 */
export function getAllRules() {
  return {
    cycle1: CYCLE1_RULES.map(r => ({ ...r, pattern: r.pattern.source })),
    cycle2: CYCLE2_RULES.map(r => ({ ...r, pattern: r.pattern.source })),
    cycle4: getAllCycle4Rules()
  };
}

// ─── Internal ─────────────────────────────────────────────────────────────

function _runRules(rules, content, fileExt, context, config) {
  const violations = [];
  const disabledRules = config.disabledRules || [];

  for (const rule of rules) {
    // Skip if rule is disabled in config
    if (disabledRules.includes(rule.id)) continue;

    // Check if rule applies to this context
    if (rule.appliesTo !== 'all' && rule.appliesTo !== context) continue;

    // Check file extension filter
    if (rule.fileExtensions && fileExt) {
      if (!rule.fileExtensions.includes(fileExt)) continue;
    }

    // Test pattern against content
    if (rule.pattern.test(content)) {
      violations.push({
        ruleId: rule.id,
        cycle: rules === CYCLE1_RULES ? 1 : 2,
        message: rule.message
      });
    }
  }

  return violations;
}
