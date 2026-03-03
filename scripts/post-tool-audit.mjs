#!/usr/bin/env node

/**
 * Post-Tool Audit — Non-blocking audit logger for every tool operation.
 *
 * This PostToolUse hook:
 *   1. Reads the tool execution result from stdin
 *   2. Logs the operation to the JSONL audit trail
 *   3. Optionally runs LLM advisory analysis (when config.llm.enabled)
 *   4. Always exits 0 (never blocks)
 *
 * This provides full auditability of every Claude Code operation.
 */

import { readStdinJSON, isResearchFile, failOpen } from './lib/utils.mjs';
import { logPostTool, logEntry } from './lib/audit-logger.mjs';
import { loadConfig } from './lib/config-loader.mjs';

await failOpen(async () => {
  const input = await readStdinJSON();
  if (!input) {
    process.exit(0);
  }

  const config = loadConfig();
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

  // Log the tool use
  logPostTool(toolName, metadata);

  // Optional: LLM advisory analysis (fire-and-forget within timeout)
  if (config.llm?.enabled && toolInput.content) {
    try {
      const { runAdvisory } = await import('./lib/llm-advisor.mjs');
      const findings = await runAdvisory(toolInput.content, config, metadata);
      if (findings.length > 0) {
        logEntry({
          event: 'llm-advisory',
          tool: toolName,
          decision: 'advisory',
          violations: findings,
          metadata
        }, config);
      }
    } catch (err) {
      // LLM advisory failures are silent — never block
      process.stderr.write(`[quadruple-verify] LLM advisory error: ${err.message}\n`);
    }
  }

  // Always exit cleanly — never block
  process.exit(0);
});
