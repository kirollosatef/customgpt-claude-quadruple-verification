/**
 * Model Routing for Verification — Adjusts verification intensity based on context.
 *
 * Routes tool operations to different verification levels:
 *   - light: regex-only checks for small, low-risk operations
 *   - standard: full Cycle 1+2 verification (default)
 *   - strict: all rules enabled, no disabled rules
 */

/**
 * Sensitive command patterns that trigger strict verification.
 */
const STRICT_PATTERNS = [
  /\/etc\//i,
  /\.ssh\//i,
  /\.env/i,
  /\.aws\//i,
  /credential/i,
  /rm\s+-rf/i,
  /chmod\s+777/i,
  /curl.*\|.*sh/i,
  /wget.*\|.*sh/i,
];

/**
 * Determine the verification level for a tool operation.
 * @param {string} toolName - The tool being used (e.g., 'Write', 'Bash')
 * @param {object} toolInput - The tool input parameters
 * @param {object} config - Plugin configuration (may include 'modelRouting' section)
 * @returns {'light' | 'standard' | 'strict'}
 */
export function determineVerificationLevel(toolName, toolInput, config) {
  const routingConfig = (config && config.modelRouting) || {};
  
  // If routing is disabled, always use standard
  if (routingConfig.enabled !== true) {
    return 'standard';
  }
  
  const normalized = (toolName || "").toLowerCase();
  
  // Bash commands: check for sensitive patterns
  if (normalized === 'bash') {
    const command = toolInput.command || '';
    for (const pattern of STRICT_PATTERNS) {
      if (pattern.test(command)) {
        return 'strict';
      }
    }
    // Short, simple commands get light verification
    if (command.length < 50 && !command.includes("|") && !command.includes(";")) {
      return 'light';
    }
    return 'standard';
  }
  
  // Write/Edit: small single-file changes get light, large changes get standard
  if (normalized === 'write' || normalized === 'edit') {
    const content = toolInput.content || toolInput.new_string || '';
    // Small edits (under 200 chars) get light verification
    if (content.length < 200) {
      return 'light';
    }
    return 'standard';
  }
  
  // MCP tools: always standard or strict
  if (normalized.startsWith("mcp__") || normalized.startsWith("mcp_")) {
    return 'standard';
  }
  
  return 'standard';
}

/**
 * Get modified config for the chosen verification level.
 * @param {'light' | 'standard' | 'strict'} level
 * @param {object} baseConfig - The base plugin config
 * @returns {object} Modified config for this verification level
 */
export function getVerificationConfig(level, baseConfig) {
  const config = { ...baseConfig };
  
  if (level === 'light') {
    // Light: only run critical security rules
    config._verificationLevel = "light";
    config._lightMode = true;
  }
  
  if (level === 'strict') {
    // Strict: enable all rules, remove disabled list
    config._verificationLevel = "strict";
    config.disabledRules = [];
  }
  
  if (level === 'standard') {
    config._verificationLevel = "standard";
  }
  
  return config;
}
