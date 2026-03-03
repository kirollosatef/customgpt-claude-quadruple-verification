/**
 * Prompt Budget Management — Track and limit verification token usage.
 *
 * Prevents verification messages from consuming too much of the context window.
 * Tracks tokens injected by block messages, warnings, and stop-prompt.
 * Condenses messages when over budget.
 */

/**
 * Session-level budget state.
 */
let budgetState = {
  sources: {},
  totalTokens: 0,
};

/**
 * Rough token estimation: ~4 characters per token.
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Track token injection from a verification source.
 * @param {'block-message' | 'stop-prompt' | 'behavioral-warning' | 'correction-hint'} source
 * @param {string} text - The injected text
 * @param {object} [config] - Config with maxVerificationTokens
 * @returns {{ tokens: number, overBudget: boolean }}
 */
export function trackInjection(source, text, config) {
  const tokens = estimateTokens(text);
  
  if (!budgetState.sources[source]) {
    budgetState.sources[source] = { tokens: 0, count: 0 };
  }
  budgetState.sources[source].tokens += tokens;
  budgetState.sources[source].count += 1;
  budgetState.totalTokens += tokens;
  
  const maxTokens = (config && config.maxVerificationTokens) || 500;
  return {
    tokens,
    overBudget: budgetState.totalTokens > maxTokens
  };
}

/**
 * Condense verification messages if over budget.
 * Keeps verdicts (pass/fail) but drops detailed evidence.
 * @param {Array<{message: string, ruleId: string}>} violations
 * @param {object} [config]
 * @returns {Array<{message: string, ruleId: string}>}
 */
export function condenseIfOverBudget(violations, config) {
  const maxTokens = (config && config.maxVerificationTokens) || 500;
  
  if (budgetState.totalTokens <= maxTokens) {
    return violations;
  }
  
  // Condense: keep rule IDs and short message, drop details
  return violations.map(v => ({
    ...v,
    message: v.message.length > 80 ? v.message.slice(0, 77) + "..." : v.message,
    condensed: true
  }));
}

/**
 * Get current budget usage report.
 * @returns {{ totalTokens: number, sources: object, breakdown: Array<{source: string, tokens: number, count: number}> }}
 */
export function getBudgetReport() {
  const breakdown = Object.entries(budgetState.sources).map(([source, data]) => ({
    source,
    tokens: data.tokens,
    count: data.count
  }));
  
  return {
    totalTokens: budgetState.totalTokens,
    sources: { ...budgetState.sources },
    breakdown
  };
}

/**
 * Reset budget state (for testing or session reset).
 */
export function resetBudget() {
  budgetState = {
    sources: {},
    totalTokens: 0,
  };
}
