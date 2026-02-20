#!/usr/bin/env node

/**
 * Post-Tool Audit — Non-blocking audit logger + behavioral sequence detection.
 *
 * This PostToolUse hook:
 *   1. Reads the tool execution result from stdin
 *   2. Runs behavioral sequence detection across the session (Change 3 — OpenClaw learnings)
 *   3. Logs the operation + any behavioral warnings to the JSONL audit trail
 *   4. Always exits 0 (never blocks)
 *
 * This provides full auditability and cross-tool-call pattern detection.
 */

import { readStdinJSON, isResearchFile, failOpen } from './lib/utils.mjs';
import { logPostTool } from './lib/audit-logger.mjs';
import { trackAndDetect } from './lib/behavior-tracker.mjs';
import { detectInjectionPatterns } from './lib/content-boundary.mjs';
import { detectSensitiveAccess, captureSystemState, logSystemEvent } from './lib/system-monitor.mjs';

await failOpen(async () => {
  const input = await readStdinJSON();
  if (!input) {
    process.exit(0);
  }

  const toolName = input.tool_name || 'unknown';
  const toolInput = input.tool_input || {};

  // Extract relevant metadata (avoid logging full content for privacy)
  const metadata = {};

  if (toolInput.file_path) {
    metadata.filePath = toolInput.file_path;
  }
  if (toolInput.command) {
    // Log first 200 chars of command for auditability without excessive data
    metadata.command = toolInput.command.slice(0, 200);
  }
  if (toolInput.url) {
    metadata.url = toolInput.url;
  }
  if (toolInput.pattern) {
    metadata.pattern = toolInput.pattern;
  }

  // Add applicable cycles context based on file type
  if (toolInput.file_path) {
    metadata.applicableCycles = isResearchFile(toolInput.file_path)
      ? 'Cycle 4 (Research Verification)'
      : 'Cycles 1-3';
  }

  // Run behavioral sequence detection (SecureClaw-inspired cross-tool-call analysis)
  const behaviorWarnings = trackAndDetect(toolName, toolInput);
  if (behaviorWarnings.length > 0) {
    metadata.behaviorWarnings = behaviorWarnings;
  }

  // System monitoring for Bash commands (sensitive path detection + process snapshot)
  if (normalized === 'bash' && toolInput.command) {
    const sensitiveHits = detectSensitiveAccess(toolInput.command);
    if (sensitiveHits.length > 0) {
      metadata.sensitiveAccess = sensitiveHits;
      process.stderr.write(sensitiveHits.map(d =>
        '[quadruple-verify][system-monitor] WARNING: Sensitive path access detected: ' + d.description + '
'
      ).join(''));
      // Capture process state after sensitive access for audit trail
      const systemState = captureSystemState();
      metadata.systemState = systemState;
      logSystemEvent('sensitive-access', { command: toolInput.command.slice(0, 200), detections: sensitiveHits, systemState }, (name, data) => {
        // Already logged via logPostTool below
      });
    }
  }

  // Scan external content for injection patterns (WebFetch/WebSearch/MCP results)
  const normalized = toolName.toLowerCase();
  if (normalized === 'webfetch' || normalized === 'websearch' || normalized.startsWith('mcp__') || normalized.startsWith('mcp_')) {
    const contentToScan = toolInput.content || toolInput.result || toolInput.output || '';
    if (contentToScan) {
      const injections = detectInjectionPatterns(contentToScan);
      if (injections.length > 0) {
        metadata.injectionWarnings = injections;
        process.stderr.write(injections.map(d =>
          `[quadruple-verify][boundary] WARNING: Injection pattern "${d.id}" detected: ${d.description}\n`
        ).join(''));
      }
    }
  }

  // Log the tool use (includes any behavioral warnings)
  logPostTool(toolName, metadata);

  // Always exit cleanly — never block
  process.exit(0);
});
