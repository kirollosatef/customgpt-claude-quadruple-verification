#!/usr/bin/env node

/**
 * Pre-Tool Gate — Cycle 1 (Code Quality) + Cycle 2 (Security) enforcement.
 *
 * This is the main PreToolUse hook dispatcher. It:
 *   1. Reads the hook input from stdin (JSON)
 *   2. Extracts the content to verify based on tool type
 *   3. Runs Cycle 1 (quality) and Cycle 2 (security) rules
 *   4. Outputs { decision: "block", reason: "..." } on violation
 *   5. Logs the decision to the audit trail
 *   6. Fails open on any crash (operation proceeds)
 *
 * Supported tools:
 *   - Write (content field)
 *   - Edit (new_string field)
 *   - Bash (command field)
 *   - MCP tools (input fields)
 *   - WebFetch/WebSearch (url field)
 */

import { readStdinJSON, deny, approve, getFileExtension, isResearchFile, failOpen } from './lib/utils.mjs';
import { runCycle1, runCycle2 } from './lib/rules-engine.mjs';
import { runCycle4 } from './lib/research-verifier.mjs';
import { logPreTool } from './lib/audit-logger.mjs';
import { loadConfig, getTrustLevel } from './lib/config-loader.mjs';
import { checkCapabilities } from './lib/capability-gate.mjs';
import { trackInjection, condenseIfOverBudget } from './lib/prompt-budget.mjs';
import { buildCorrectionHint, trackCorrectionAttempt, escalateIfNeeded } from './lib/self-correction.mjs';
import { determineVerificationLevel, getVerificationConfig } from './lib/model-router.mjs';

await failOpen(async () => {
  const input = await readStdinJSON();
  if (!input) {
    approve();
    process.exit(0);
  }

  const config = loadConfig();

  // Lean mode: skip Cycle 1+2 pre-tool checks entirely.
  // Stop prompt, behavioral tracking, audit, and Cycle 4 remain active.
  if (config.leanMode === true) {
    logPreTool(input.tool_name || '', 'approve', [], { reason: 'lean-mode' });
    approve();
    process.exit(0);
  }

  const toolName = input.tool_name || '';
  const toolInput = input.tool_input || {};

  // Trust level enforcement
  const trustLevel = getTrustLevel(config);
  if (trustLevel === 'minimal') {
    logPreTool(toolName, 'approve', [], { reason: 'trust-minimal' });
    approve();
    process.exit(0);
  }

  // In strict mode, enable all rules (remove disabled rules)
  if (trustLevel === 'strict') {
    config = { ...config, disabledRules: [] };
  }

  // Capability enforcement — check if tool is allowed to use declared resources
  const capResult = checkCapabilities(toolName, config);
  if (!capResult.allowed) {
    const capMsg = `Quadruple Verification BLOCKED: Tool "${toolName}" requires capabilities [${capResult.missing.join(', ')}] which are not in the allowed list.`;
    logPreTool(toolName, 'block', [{ ruleId: 'capability-denied', message: capMsg }], { missing: capResult.missing });
    deny(capMsg);
    process.exit(0);
  }

  // Determine what content to verify and what context to use
  const { content, context, fileExt, filePath } = extractContent(toolName, toolInput);

  if (!content) {
    // No content to verify — approve
    logPreTool(toolName, 'approve', [], { reason: 'no-content' });
    approve();
    process.exit(0);
  }

  // Model routing: adjust verification intensity based on context
  if (config.modelRouting && config.modelRouting.enabled === true) {
    const verLevel = determineVerificationLevel(toolName, toolInput, config);
    if (verLevel !== 'standard') {
      const adjustedConfig = getVerificationConfig(verLevel, config);
      // Use adjusted config for remaining checks
      Object.assign(config, adjustedConfig);
    }
  }

  // Route to the appropriate verification cycles
  let allViolations;

  if (isResearchFile(filePath) && config.cycle4?.enabled !== false) {
    // Research files → Cycle 4 only
    allViolations = runCycle4(content, filePath, config);
  } else {
    // All other files → Cycles 1 + 2
    const cycle1Violations = runCycle1(content, fileExt, context, config);
    const cycle2Violations = runCycle2(content, fileExt, context, config);
    allViolations = [...cycle1Violations, ...cycle2Violations];
  }

  if (allViolations.length > 0) {
    // Format violation messages
    const reasons = allViolations.map(v =>
      `[Cycle ${v.cycle} - ${v.ruleId}] ${v.message}`
    );
    const reasonText = `Quadruple Verification BLOCKED this operation:\n\n${reasons.join('\n\n')}\n\nFix these issues and try again.`;

    // Track token budget usage for this block message
    const budgetResult = trackInjection('block-message', reasonText, config);
    if (budgetResult.overBudget) {
      allViolations = condenseIfOverBudget(allViolations, config);
      const condensedReasons = allViolations.map(v =>
        `[Cycle ${v.cycle} - ${v.ruleId}] ${v.message}`
      );
      reasonText = `Quadruple Verification BLOCKED (condensed):

${condensedReasons.join('
')}

Fix these issues and try again.`;
    }
    // Self-correction: track attempt and add hints
    const correctionResult = trackCorrectionAttempt(filePath, allViolations);
    const correctionHint = buildCorrectionHint(allViolations);
    if (correctionHint) {
      reasonText += '

' + correctionHint;
    }
    if (correctionResult.isEscalated) {
      const escalation = escalateIfNeeded(filePath);
      if (escalation) {
        reasonText += '

' + escalation;
      }
    }
    logPreTool(toolName, 'block', allViolations, { fileExt, context, tokenBudget: budgetResult, corrections: correctionResult });
    deny(reasonText);
  } else {
    logPreTool(toolName, 'approve', [], { fileExt, context });
    approve();
  }
});

/**
 * Extract verifiable content from tool input based on tool type.
 */
function extractContent(toolName, toolInput) {
  const normalized = toolName.toLowerCase();

  const filePath = toolInput.file_path || '';

  // Write tool — verify file content
  if (normalized === 'write') {
    return {
      content: toolInput.content || '',
      context: 'file-write',
      fileExt: getFileExtension(filePath),
      filePath
    };
  }

  // Edit tool — verify new_string
  if (normalized === 'edit') {
    return {
      content: toolInput.new_string || '',
      context: 'file-write',
      fileExt: getFileExtension(filePath),
      filePath
    };
  }

  // Bash tool — verify command
  if (normalized === 'bash') {
    return {
      content: toolInput.command || '',
      context: 'bash',
      fileExt: '',
      filePath: ''
    };
  }

  // WebFetch / WebSearch — verify URL
  if (normalized === 'webfetch' || normalized === 'websearch') {
    return {
      content: toolInput.url || toolInput.query || '',
      context: 'web',
      fileExt: '',
      filePath: ''
    };
  }

  // MCP tools (prefixed with mcp__) — verify all input values + enhanced validation
  if (normalized.startsWith('mcp__') || normalized.startsWith('mcp_')) {
    const values = Object.values(toolInput)
      .filter(v => typeof v === 'string')
      .join('\n');

    // Enhanced MCP validation (Change 4 — OpenClaw learnings)
    const mcpWarnings = validateMcpInput(toolInput, config);
    if (mcpWarnings.length > 0) {
      // MCP-specific warnings are appended to content so Cycle 2 rules can also fire
      process.stderr.write(mcpWarnings.map(w => `[quadruple-verify][mcp] WARNING: ${w}\n`).join(''));
    }

    return {
      content: values,
      context: 'mcp',
      fileExt: '',
      filePath: ''
    };
  }

  // Unknown tool — nothing to verify
  return { content: '', context: 'unknown', fileExt: '', filePath: '' };
}

/**
 * Enhanced MCP tool input validation (Change 4 — OpenClaw/ClawHavoc learnings).
 *
 * Checks:
 *   1. Sensitive data in MCP inputs (API keys, tokens, credentials)
 *   2. Input size limits (flag suspiciously large payloads)
 */
const MCP_SENSITIVE_PATTERNS = [
  { name: 'API key', pattern: /(?:api[_-]?key|api[_-]?secret)\s*[:=]\s*\S{8,}/i },
  { name: 'Bearer token', pattern: /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/i },
  { name: 'Authorization header', pattern: /Authorization:\s*\S{10,}/i },
  { name: 'Private key block', pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/i },
  { name: 'AWS credential', pattern: /(?:AKIA|ASIA)[A-Z0-9]{16}/i },
  { name: 'Password field', pattern: /(?:password|passwd|pwd)\s*[:=]\s*\S{4,}/i },
];

function validateMcpInput(toolInput, config) {
  const warnings = [];
  const mcpConfig = config.mcp || {};
  const maxInputSize = mcpConfig.maxInputSizeBytes || 10240; // 10 KB default

  // Collect all string values from the input
  const allValues = Object.entries(toolInput)
    .filter(([, v]) => typeof v === 'string')
    .map(([k, v]) => ({ key: k, value: v }));

  const concatenated = allValues.map(e => e.value).join('');

  // Check 1: Sensitive data detection
  for (const { key, value } of allValues) {
    for (const { name, pattern } of MCP_SENSITIVE_PATTERNS) {
      if (pattern.test(value)) {
        warnings.push(`MCP input field "${key}" appears to contain a ${name}. Verify this is intentional and not leaking credentials.`);
        break; // one warning per field is enough
      }
    }
  }

  // Check 2: Input size limit
  const totalSize = Buffer.byteLength(concatenated, 'utf-8');
  if (totalSize > maxInputSize) {
    warnings.push(`MCP input payload is ${(totalSize / 1024).toFixed(1)} KB (limit: ${(maxInputSize / 1024).toFixed(1)} KB). Large payloads may indicate data exfiltration.`);
  }

  return warnings;
}
