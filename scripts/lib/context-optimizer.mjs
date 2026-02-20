/**
 * Context Window Optimization — Track rule effectiveness and prioritize messages.
 *
 * Learns which rules are effective (violations get fixed on next attempt)
 * and which are ignored (same violation repeated). Uses this to prioritize
 * and condense verification messages for better context window usage.
 */

/**
 * Session-level effectiveness state.
 */
let effectivenessState = {};

/**
 * Track a rule's effectiveness outcome.
 * @param {string} ruleId - The rule that produced the violation
 * @param {'fixed' | 'ignored'} outcome - Whether the violation was resolved or repeated
 */
export function trackRuleEffectiveness(ruleId, outcome) {
  if (!ruleId || !outcome) return;
  
  if (!effectivenessState[ruleId]) {
    effectivenessState[ruleId] = { fixed: 0, ignored: 0, total: 0 };
  }
  
  if (outcome === 'fixed') {
    effectivenessState[ruleId].fixed += 1;
  } else if (outcome === 'ignored') {
    effectivenessState[ruleId].ignored += 1;
  }
  effectivenessState[ruleId].total += 1;
}

/**
 * Get effectiveness scores for all tracked rules.
 * @returns {Array<{ruleId: string, effectiveness: number, fixed: number, ignored: number, total: number}>}
 */
export function getEffectivenessScores() {
  return Object.entries(effectivenessState).map(([ruleId, data]) => ({
    ruleId,
    effectiveness: data.total > 0 ? data.fixed / data.total : 0,
    fixed: data.fixed,
    ignored: data.ignored,
    total: data.total
  })).sort((a, b) => b.effectiveness - a.effectiveness);
}

/**
 * Prioritize violations by effectiveness — most effective rules first.
 * Low-effectiveness violations get condensed messages.
 * @param {Array<{ruleId: string, message: string}>} violations
 * @returns {Array<{ruleId: string, message: string, effectiveness?: number}>}
 */
export function prioritizeMessages(violations) {
  if (!violations || violations.length === 0) return [];
  
  return violations
    .map(v => {
      const state = effectivenessState[v.ruleId];
      const eff = state && state.total > 0 ? state.fixed / state.total : 0.5;
      return { ...v, effectiveness: eff };
    })
    .sort((a, b) => b.effectiveness - a.effectiveness)
    .map((v, i) => {
      // Condense low-effectiveness violations after the first 3
      if (i >= 3 && v.effectiveness < 0.3) {
        return {
          ...v,
          message: `[${v.ruleId}] ${v.message.slice(0, 50)}...`,
          condensed: true
        };
      }
      return v;
    });
}

/**
 * Analyze previous violations against current ones to auto-track effectiveness.
 * Call this when a new set of violations comes in for the same file.
 * @param {Array<{ruleId: string}>} previousViolations
 * @param {Array<{ruleId: string}>} currentViolations
 */
export function analyzeEffectiveness(previousViolations, currentViolations) {
  if (!previousViolations || !currentViolations) return;
  
  const currentRuleIds = new Set(currentViolations.map(v => v.ruleId));
  
  for (const prev of previousViolations) {
    if (currentRuleIds.has(prev.ruleId)) {
      // Same rule still firing = ignored
      trackRuleEffectiveness(prev.ruleId, 'ignored');
    } else {
      // Rule no longer firing = fixed
      trackRuleEffectiveness(prev.ruleId, 'fixed');
    }
  }
}

/**
 * Reset effectiveness state (for testing or session reset).
 */
export function resetEffectivenessState() {
  effectivenessState = {};
}
