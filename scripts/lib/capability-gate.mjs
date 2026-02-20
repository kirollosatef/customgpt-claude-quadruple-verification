/**
 * Capability Gate — Declares and enforces tool capabilities.
 *
 * Each tool declares what system resources it accesses (filesystem, shell,
 * network, mcp). If a tool attempts an operation not in the allowed
 * capabilities list, it is blocked (fail-closed by default).
 *
 * Configurable via config.capabilities section.
 */

// ─── Tool Capability Declarations ───────────────────────────────────────────

const TOOL_CAPABILITIES = {
  write: ['filesystem'],
  edit: ['filesystem'],
  read: ['filesystem'],
  glob: ['filesystem'],
  grep: ['filesystem'],
  bash: ['shell', 'filesystem', 'network'],
  webfetch: ['network'],
  websearch: ['network'],
};

// MCP tools default to 'mcp' capability
const MCP_PREFIX_PATTERNS = ['mcp__', 'mcp_'];

/**
 * Determine the required capabilities for a given tool.
 * @param {string} toolName - The tool name (e.g., "Write", "Bash", "mcp__perplexity__search")
 * @returns {string[]} Array of required capability names
 */
export function getToolCapabilities(toolName) {
  const normalized = (toolName || '').toLowerCase();

  // Check MCP tools first
  if (MCP_PREFIX_PATTERNS.some(p => normalized.startsWith(p))) {
    return ['mcp'];
  }

  return TOOL_CAPABILITIES[normalized] || [];
}

/**
 * Check if a tool's capabilities are allowed by the config.
 * @param {string} toolName - The tool name
 * @param {object} config - Configuration object with capabilities section
 * @returns {{ allowed: boolean, missing: string[] }}
 */
export function checkCapabilities(toolName, config = {}) {
  const capConfig = config.capabilities || {};

  // If capabilities enforcement is disabled, allow everything
  if (capConfig.enabled === false) {
    return { allowed: true, missing: [] };
  }

  const allowedCaps = capConfig.allowed || ['filesystem', 'shell', 'network', 'mcp'];
  const required = getToolCapabilities(toolName);

  // No capabilities declared = unknown tool. Use failClosed setting.
  if (required.length === 0) {
    const failClosed = capConfig.failClosed !== false; // default true
    if (failClosed) {
      return { allowed: false, missing: ['unknown'] };
    }
    return { allowed: true, missing: [] };
  }

  const missing = required.filter(cap => !allowedCaps.includes(cap));

  return {
    allowed: missing.length === 0,
    missing
  };
}
